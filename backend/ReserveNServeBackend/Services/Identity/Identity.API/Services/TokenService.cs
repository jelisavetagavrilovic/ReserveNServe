using Identity.API.Data;
using Identity.API.Entities;
using Identity.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Identity.API.Services;

public class TokenService
    : ITokenService
{
    private readonly IConfiguration _config;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppIdentityDbContext _db;
    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes).ToLowerInvariant(); // 64-char hex
    }
    public TokenService(IConfiguration config, UserManager<ApplicationUser> userManager, AppIdentityDbContext db)
    {
        _config = config;
        _userManager = userManager;
        _db = db;
    }

    public async Task<(string accessToken, DateTime expiresAtUtc)> CreateAccessTokenAsync(ApplicationUser user)
    {
        var jwt = _config.GetSection("Jwt");
        var issuer = jwt["Issuer"]!;
        var audience = jwt["Audience"]!;
        var key = jwt["Key"]!;
        var minutes = int.TryParse(jwt["AccessTokenMinutes"], out var m) ? m : 60;

        var expires = DateTime.UtcNow.AddMinutes(minutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256
        );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds
        );

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public async Task<(RefreshToken entity, string plainToken)> CreateRefreshTokenAsync(ApplicationUser user)
    {
        var days = _config.GetValue<int>("RefreshToken:ExpirationDays");
        if (days <= 0) days = 14;

        // secure random token (base64url-ish)
        var bytes = RandomNumberGenerator.GetBytes(32);
        var plain = Convert.ToBase64String(bytes)
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

        var rt = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(plain),   //store hash, not plaintext
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(days)
        };

        _db.RefreshTokens.Add(rt);
        await _db.SaveChangesAsync();

        return (rt, plain);
    }

    public async Task<(string accessToken, DateTime expiresAtUtc, string refreshToken)> CreateAuthResponseAsync(ApplicationUser user)
    {
        var (access, exp) = await CreateAccessTokenAsync(user);
        var (_, plainRefresh) = await CreateRefreshTokenAsync(user);
        return (access, exp, plainRefresh);
    }

    public async Task<(string accessToken, DateTime expiresAtUtc, string refreshToken)?> RefreshAsync(string refreshToken)
    {
        var hash = HashToken(refreshToken);

        var token = await _db.RefreshTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.TokenHash == hash);

        if (token == null) return null;
        if (token.IsRevoked)
        {
            // revoke ALL tokens for that user (account protection)
            await RevokeAllRefreshTokensForUserAsync(token.UserId);
            return null;
        }

        if (token.IsExpired) return null;
        // rotate: revoke old token, issue a new one
        token.RevokedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await CreateAuthResponseAsync(token.User);
    }

    public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return false;

        var hash = HashToken(refreshToken);

        var token = await _db.RefreshTokens
            .SingleOrDefaultAsync(t => t.TokenHash == hash);

        if (token == null)
            return false;

        if (token.RevokedAtUtc != null)
            return false;

        if (token.ExpiresAtUtc <= DateTime.UtcNow)
            return false;

        token.RevokedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<int> RevokeAllRefreshTokensForUserAsync(string userId)
    {
        var tokens = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync();

        if (tokens.Count == 0) return 0;

        var now = DateTime.UtcNow;
        foreach (var t in tokens)
            t.RevokedAtUtc = now;

        await _db.SaveChangesAsync();
        return tokens.Count;
    }
}