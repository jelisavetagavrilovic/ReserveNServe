using FluentAssertions;
using Identity.API.Data;
using Identity.API.DTOs;
using Identity.API.DTOs.Auth;
using Identity.API.Services;
using Identity.API.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Moq;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Xunit;

namespace Identity.API.Tests;

public class AuthApplicationServiceTests
{
    [Fact]
    public async Task RegisterAsync_ShouldReturn409_WhenEmailAlreadyExists()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        userManager.Setup(x => x.FindByEmailAsync("ana@test.com"))
            .ReturnsAsync(new ApplicationUser { Email = "ana@test.com" });

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = await service.RegisterAsync(
            new RegisterRequest("ana@test.com", "Password123"),
            isDevelopment: true);

        result.StatusCode.Should().Be(StatusCodes.Status409Conflict);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturn401_WhenEmailNotConfirmed()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        userManager.Setup(x => x.FindByEmailAsync("ana@test.com"))
            .ReturnsAsync(new ApplicationUser
            {
                Email = "ana@test.com",
                EmailConfirmed = false
            });

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = await service.LoginAsync(new LoginRequest("ana@test.com", "Password123"));

        result.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturn200_WhenCredentialsAreValid()
    {
        var user = new ApplicationUser
        {
            Id = "u1",
            Email = "ana@test.com",
            EmailConfirmed = true
        };

        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        userManager.Setup(x => x.FindByEmailAsync("ana@test.com"))
            .ReturnsAsync(user);

        signInManager.Setup(x => x.CheckPasswordSignInAsync(user, "Password123", true))
            .ReturnsAsync(SignInResult.Success);

        tokens.Setup(x => x.CreateAuthResponseAsync(user))
            .ReturnsAsync(("access-token", DateTime.UtcNow.AddMinutes(60), "refresh-token"));

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = await service.LoginAsync(new LoginRequest("ana@test.com", "Password123"));

        result.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task RefreshAsync_ShouldReturn401_WhenRefreshTokenIsInvalid()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        tokens.Setup(x => x.RefreshAsync("bad-token"))
            .ReturnsAsync(((string accessToken, DateTime expiresAtUtc, string refreshToken)?)null);

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = await service.RefreshAsync(new RefreshRequest("bad-token"));

        result.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task LogoutAsync_ShouldReturn404_WhenTokenIsInvalid()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        tokens.Setup(x => x.RevokeRefreshTokenAsync("bad-token"))
            .ReturnsAsync(false);

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = await service.LogoutAsync(new LogoutRequest("bad-token"));

        result.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public void Me_ShouldReturn200_WhenClaimsExist()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "u1"),
            new Claim(ClaimTypes.Email, "ana@test.com"),
            new Claim(ClaimTypes.Role, "User")
        }, "test"));

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = service.Me(principal);

        result.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task LogoutAllAsync_ShouldRevokeAllTokens_ForCurrentUser()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        tokens.Setup(x => x.RevokeAllRefreshTokensForUserAsync("u1"))
            .ReturnsAsync(3);

        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
        new Claim(ClaimTypes.NameIdentifier, "u1")
    }, "test"));

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = await service.LogoutAllAsync(principal);

        result.StatusCode.Should().Be(StatusCodes.Status202Accepted);
        tokens.Verify(x => x.RevokeAllRefreshTokensForUserAsync("u1"), Times.Once);
    }

    [Fact]
    public async Task LoginAsync_ShouldReturn401_WhenUserIsLockedOut()
    {
        var user = new ApplicationUser
        {
            Id = "u1",
            Email = "ana@test.com",
            EmailConfirmed = true
        };

        var userManager = TestHelpers.CreateUserManagerMock();
        var signInManager = TestHelpers.CreateSignInManagerMock(userManager.Object);
        var tokens = new Mock<ITokenService>();

        userManager.Setup(x => x.FindByEmailAsync("ana@test.com"))
            .ReturnsAsync(user);

        signInManager.Setup(x => x.CheckPasswordSignInAsync(user, "Password123", true))
            .ReturnsAsync(SignInResult.LockedOut);

        var service = new AuthApplicationService(userManager.Object, signInManager.Object, tokens.Object);

        var result = await service.LoginAsync(new LoginRequest("ana@test.com", "Password123"));

        result.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
    }
}