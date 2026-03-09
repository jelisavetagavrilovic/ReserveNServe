using Identity.API.Data;
using Identity.API.Entities;

namespace Identity.API.Services.Interfaces;

public interface ITokenService
{
    Task<(string accessToken, DateTime expiresAtUtc)> CreateAccessTokenAsync(ApplicationUser user);
    Task<(RefreshToken entity, string plainToken)> CreateRefreshTokenAsync(ApplicationUser user);
    Task<(string accessToken, DateTime expiresAtUtc, string refreshToken)> CreateAuthResponseAsync(ApplicationUser user);
    Task<(string accessToken, DateTime expiresAtUtc, string refreshToken)?> RefreshAsync(string refreshToken);
    Task<bool> RevokeRefreshTokenAsync(string refreshToken);
    Task<int> RevokeAllRefreshTokensForUserAsync(string userId);
}