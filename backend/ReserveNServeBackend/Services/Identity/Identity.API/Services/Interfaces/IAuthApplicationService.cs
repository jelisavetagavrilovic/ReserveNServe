using Identity.API.DTOs;
using Identity.API.DTOs.Auth;
using Identity.API.Services.Results;
using System.Security.Claims;

namespace Identity.API.Services.Interfaces;

public interface IAuthApplicationService
{
    Task<AppResult> RegisterAsync(RegisterRequest request, bool isDevelopment);
    Task<AppResult> LoginAsync(LoginRequest request);
    Task<AppResult> RefreshAsync(RefreshRequest request);
    Task<AppResult> LogoutAsync(LogoutRequest request);
    Task<AppResult> MeAsync(ClaimsPrincipal user);
    Task<AppResult> UpdateProfileAsync(ClaimsPrincipal user, UpdateProfileRequest request);
    Task<AppResult> LogoutAllAsync(ClaimsPrincipal user);
    Task<AppResult> ConfirmEmailAsync(ConfirmEmailRequest request);
    Task<AppResult> ForgotPasswordAsync(ForgotPasswordRequest request, bool isDevelopment);
    Task<AppResult> ResetPasswordAsync(ResetPasswordRequest request);
   
}