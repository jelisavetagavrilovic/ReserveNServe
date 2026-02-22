using Identity.API.Data;
using Identity.API.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Identity.API.Services;

public class TokenService
{
    private readonly IConfiguration _config;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppIdentityDbContext _db;

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

    public async Task<RefreshToken> CreateRefreshTokenAsync(ApplicationUser user)
    {
        var days = _config.GetValue<int>("RefreshToken:ExpirationDays");
        if (days <= 0) days = 14;

        // secure random token (base64url-ish)
        var bytes = RandomNumberGenerator.GetBytes(32);
        var tokenString = Convert.ToBase64String(bytes)
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

        var rt = new RefreshToken
        {
            UserId = user.Id,
            Token = tokenString,
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(days)
        };

        _db.RefreshTokens.Add(rt);
        await _db.SaveChangesAsync();

        return rt;
    }

    public async Task<(string accessToken, DateTime expiresAtUtc, string refreshToken)> CreateAuthResponseAsync(ApplicationUser user)
    {
        var (access, exp) = await CreateAccessTokenAsync(user);
        var refresh = await CreateRefreshTokenAsync(user);
        return (access, exp, refresh.Token);
    }

    public async Task<(string accessToken, DateTime expiresAtUtc, string refreshToken)?> RefreshAsync(string refreshToken)
    {
        var token = await _db.RefreshTokens
            .Include(t => t.User)
            .SingleOrDefaultAsync(t => t.Token == refreshToken);

        if (token == null) return null;
        if (token.IsRevoked || token.IsExpired) return null;

        // rotate: revoke old token, issue a new one
        token.RevokedAtUtc = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return await CreateAuthResponseAsync(token.User);
    }

    public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
    {
        var token = await _db.RefreshTokens.SingleOrDefaultAsync(t => t.Token == refreshToken);
        if (token == null) return false;

        if (!token.IsRevoked)
        {
            token.RevokedAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }

        return true;
    }
}