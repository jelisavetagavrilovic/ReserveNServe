using Identity.API.Data;
using Identity.API.DTOs;
using Identity.API.DTOs.Auth;
using Identity.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly TokenService _tokens;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        TokenService tokens)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokens = tokens;
    }

    [EnableRateLimiting("register")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing != null)
        {
            return Conflict(new
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
            return BadRequest(new
            {
                message = "Registration failed.",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        var addRole = await _userManager.AddToRoleAsync(user, "User");
        if (!addRole.Succeeded)
        {
            return BadRequest(new
            {
                message = "User created, but assigning default role failed.",
                errors = addRole.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);

        return Ok(new
        {
            message = "Registration successful. Please confirm email before login.",
            dev = new { userId = user.Id, token }
        });
    }

    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid credentials." });
        if (!user.EmailConfirmed)
            return Unauthorized(new { message = "Email is not confirmed." });

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
            return Unauthorized(new { message = "Account is temporarily locked. Try again later." });
        
        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid credentials." });

        var auth = await _tokens.CreateAuthResponseAsync(user);
        return Ok(new AuthResponse(auth.accessToken, auth.expiresAtUtc, auth.refreshToken));
    }

    [EnableRateLimiting("refresh")]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request)
    {
        var auth = await _tokens.RefreshAsync(request.RefreshToken);
        if (auth == null)
        {
            return Unauthorized(new { message = "Invalid refresh token." });
        }
        return Ok(new AuthResponse(auth.Value.accessToken, auth.Value.expiresAtUtc, auth.Value.refreshToken));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request)
    {
        var ok = await _tokens.RevokeRefreshTokenAsync(request.RefreshToken);
        if (!ok)
            return NotFound(new { message = "Refresh token not found." });

        return Accepted(new { message = "Logged out." });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            UserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub),
            Email = User.FindFirstValue(ClaimTypes.Email),
            Claims = User.Claims.Select(c => new { c.Type, c.Value })
        });
    }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll()
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null)
            return Unauthorized(new { message = "Unauthorized." });

        var count = await _tokens.RevokeAllRefreshTokensForUserAsync(userId);

        return Accepted(new
        {
            message = "Logged out from all sessions.",
            revokedTokens = count
        });
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        var result = await _userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Email confirmation failed.",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return Ok(new { message = "Email confirmed successfully." });
    }

    [EnableRateLimiting("login")] 
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
            return Ok(new { message = "If the email exists, a reset link was generated." });

        if (!user.EmailConfirmed)
            return Ok(new { message = "If the email exists, a reset link was generated." });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        // DEV: return link so you can test in Swagger
        // In prod: send via email
        var link = new
        {
            userId = user.Id,
            token
        };

        return Ok(new
        {
            message = "If the email exists, a reset link was generated.",
            dev = link
        });
    }

    [EnableRateLimiting("login")] // reuse policy or make "reset" policy
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByIdAsync(request.UserId);
        if (user == null)
            return NotFound(new { message = "User not found." });

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Password reset failed.",
                errors = result.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return Ok(new { message = "Password has been reset." });
    }
}