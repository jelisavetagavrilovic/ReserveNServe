using Identity.API.DTOs;
using Identity.API.DTOs.Auth;
using Identity.API.Services.Interfaces;
using Identity.API.Services.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthApplicationService _authService;
    private readonly IWebHostEnvironment _env;

    public AuthController(
        IAuthApplicationService authService,
        IWebHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [EnableRateLimiting("register")]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request, _env.IsDevelopment());
        return ToActionResult(result);
    }

    [EnableRateLimiting("login")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return ToAuthActionResult(result);
    }

    [EnableRateLimiting("refresh")]
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(RefreshRequest request)
    {
        var result = await _authService.RefreshAsync(request);
        return ToAuthActionResult(result);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(LogoutRequest request)
    {
        var result = await _authService.LogoutAsync(request);
        return ToActionResult(result);
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return ToActionResult(_authService.Me(User));
    }

    [Authorize]
    [HttpPost("logout-all")]
    public async Task<IActionResult> LogoutAll()
    {
        var result = await _authService.LogoutAllAsync(User);
        return ToActionResult(result);
    }

    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail(ConfirmEmailRequest request)
    {
        var result = await _authService.ConfirmEmailAsync(request);
        return ToActionResult(result);
    }

    [EnableRateLimiting("login")]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        var result = await _authService.ForgotPasswordAsync(request, _env.IsDevelopment());
        return ToActionResult(result);
    }

    [EnableRateLimiting("login")]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request);
        return ToActionResult(result);
    }

    private IActionResult ToActionResult(AppResult result)
    {
        return StatusCode(result.StatusCode, result.Body);
    }

    private ActionResult<AuthResponse> ToAuthActionResult(AppResult result)
    {
        if (result.StatusCode == StatusCodes.Status200OK && result.Body is AuthResponse auth)
        {
            return Ok(auth);
        }

        return StatusCode(result.StatusCode, result.Body);
    }
}