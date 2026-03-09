using Identity.API.Data;
using Identity.API.DTOs;
using Identity.API.DTOs.Auth;
using Identity.API.Services.Interfaces;
using Identity.API.Services.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Identity.API.Services;

public class AuthApplicationService : IAuthApplicationService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokens;

    public AuthApplicationService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokens)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokens = tokens;
    }

    public async Task<AppResult> RegisterAsync(RegisterRequest request, bool isDevelopment)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
        {
            return new AppResult(StatusCodes.Status409Conflict, new
            {
                message = "Email is already registered."
            });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new
            {
                message = "Registration failed.",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        var addRole = await _userManager.AddToRoleAsync(user, "User");
        if (!addRole.Succeeded)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new
            {
                message = "User created, but assigning default role failed.",
                errors = addRole.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        if (isDevelopment)
        {
            return new AppResult(StatusCodes.Status200OK, new
            {
                message = "Registration successful. Please confirm email before login.",
                dev = new { userId = user.Id, token }
            });
        }

        return new AppResult(StatusCodes.Status200OK, new
        {
            message = "Registration successful. Please confirm email before login."
        });
    }

    public async Task<AppResult> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Invalid credentials." });
        }

        if (!user.EmailConfirmed)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Email is not confirmed." });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Account is temporarily locked. Try again later." });
        }

        if (!result.Succeeded)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Invalid credentials." });
        }

        var auth = await _tokens.CreateAuthResponseAsync(user);
        return new AppResult(StatusCodes.Status200OK, new AuthResponse(auth.accessToken, auth.expiresAtUtc, auth.refreshToken));
    }

    public async Task<AppResult> RefreshAsync(RefreshRequest request)
    {
        var auth = await _tokens.RefreshAsync(request.RefreshToken);
        if (auth == null)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Invalid refresh token." });
        }

        return new AppResult(StatusCodes.Status200OK, new AuthResponse(auth.Value.accessToken, auth.Value.expiresAtUtc, auth.Value.refreshToken));
    }

    public async Task<AppResult> LogoutAsync(LogoutRequest request)
    {
        var ok = await _tokens.RevokeRefreshTokenAsync(request.RefreshToken);
        if (!ok)
        {
            return new AppResult(StatusCodes.Status404NotFound, new { message = "Refresh token not found." });
        }

        return new AppResult(StatusCodes.Status202Accepted, new { message = "Logged out." });
    }

    public AppResult Me(ClaimsPrincipal user)
    {
        return new AppResult(StatusCodes.Status200OK, new
        {
            UserId = user.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub),
            Email = user.FindFirstValue(ClaimTypes.Email),
            Claims = user.Claims.Select(c => new { c.Type, c.Value })
        });
    }

    public async Task<AppResult> LogoutAllAsync(ClaimsPrincipal user)
    {
        var userId =
            user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Unauthorized." });
        }

        var count = await _tokens.RevokeAllRefreshTokensForUserAsync(userId);
        return new AppResult(StatusCodes.Status202Accepted, new
        {
            message = "Logged out from all sessions.",
            revokedTokens = count
        });
    }

    public async Task<AppResult> ConfirmEmailAsync(ConfirmEmailRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            return new AppResult(StatusCodes.Status404NotFound, new { message = "User not found." });
        }

        var result = await _userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new
            {
                message = "Email confirmation failed.",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return new AppResult(StatusCodes.Status200OK, new { message = "Email confirmed successfully." });
    }

    public async Task<AppResult> ForgotPasswordAsync(ForgotPasswordRequest request, bool isDevelopment)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            return new AppResult(StatusCodes.Status200OK, new { message = "If the email exists, a reset link was generated." });
        }

        if (!user.EmailConfirmed)
        {
            return new AppResult(StatusCodes.Status200OK, new { message = "If the email exists, a reset link was generated." });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var link = new
        {
            userId = user.Id,
            token
        };

        if (isDevelopment)
        {
            return new AppResult(StatusCodes.Status200OK, new
            {
                message = "If the email exists, a reset link was generated.",
                dev = link
            });
        }

        return new AppResult(StatusCodes.Status200OK, new
        {
            message = "If the email exists, a reset link was generated."
        });
    }

    public async Task<AppResult> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
        {
            return new AppResult(StatusCodes.Status404NotFound, new { message = "User not found." });
        }

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new
            {
                message = "Password reset failed.",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return new AppResult(StatusCodes.Status200OK, new { message = "Password has been reset." });
    }
}