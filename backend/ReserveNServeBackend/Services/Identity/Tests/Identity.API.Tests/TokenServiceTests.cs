using FluentAssertions;
using Identity.API.Data;
using Identity.API.Entities;
using Identity.API.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Identity.API.Tests;

public class TokenServiceTests
{
    private const string TestUserId = "u1";
    private const string TestEmail = "test@test";
    private const string TestFullName = "Test User";

    private static AppIdentityDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppIdentityDbContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new AppIdentityDbContext(options);
    }

    private static IConfiguration CreateConfiguration()
    {
        var values = new Dictionary<string, string?>
        {
            ["Jwt:Issuer"] = "ReserveNServe.Identity",
            ["Jwt:Audience"] = "ReserveNServe.ApiClients",
            ["Jwt:Key"] = "DEV_ONLY_CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_32+_CHARS",
            ["Jwt:AccessTokenMinutes"] = "60",
            ["RefreshToken:ExpirationDays"] = "14"
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    private static ApplicationUser CreateTestUser()
        => new()
        {
            Id = TestUserId,
            Email = TestEmail,
            UserName = TestEmail,
            FullName = TestFullName
        };

    [Fact]
    public async Task CreateRefreshTokenAsync_ShouldSaveToken()
    {
        using var db = CreateDbContext(nameof(CreateRefreshTokenAsync_ShouldSaveToken));
        var config = CreateConfiguration();
        var userManager = TestHelpers.CreateUserManagerMock();
        var service = new TokenService(config, userManager.Object, db);
        var user = CreateTestUser();

        var (entity, plainToken) = await service.CreateRefreshTokenAsync(user);

        plainToken.Should().NotBeNullOrWhiteSpace();
        entity.TokenHash.Should().NotBeNullOrWhiteSpace();

        var saved = await db.RefreshTokens.SingleAsync();
        saved.UserId.Should().Be(TestUserId);
    }

    [Fact]
    public async Task RevokeRefreshTokenAsync_ShouldReturnFalse_WhenTokenDoesNotExist()
    {
        using var db = CreateDbContext(nameof(RevokeRefreshTokenAsync_ShouldReturnFalse_WhenTokenDoesNotExist));
        var config = CreateConfiguration();
        var userManager = TestHelpers.CreateUserManagerMock();
        var service = new TokenService(config, userManager.Object, db);

        var result = await service.RevokeRefreshTokenAsync("missing-token");

        result.Should().BeFalse();
    }

    [Fact]
    public async Task RevokeAllRefreshTokensForUserAsync_ShouldRevokeActiveTokens()
    {
        using var db = CreateDbContext(nameof(RevokeAllRefreshTokensForUserAsync_ShouldRevokeActiveTokens));
        var config = CreateConfiguration();
        var userManager = TestHelpers.CreateUserManagerMock();

        db.RefreshTokens.AddRange(
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = TestUserId,
                TokenHash = "hash1",
                CreatedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(1)
            },
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = TestUserId,
                TokenHash = "hash2",
                CreatedAtUtc = DateTime.UtcNow,
                ExpiresAtUtc = DateTime.UtcNow.AddDays(1)
            });

        await db.SaveChangesAsync();

        var service = new TokenService(config, userManager.Object, db);

        var count = await service.RevokeAllRefreshTokensForUserAsync(TestUserId);

        count.Should().Be(2);
    }

    [Fact]
    public async Task RefreshAsync_ShouldReturnNull_WhenTokenIsExpired()
    {
        using var db = CreateDbContext(nameof(RefreshAsync_ShouldReturnNull_WhenTokenIsExpired));
        var config = CreateConfiguration();
        var userManager = TestHelpers.CreateUserManagerMock();
        var user = CreateTestUser();

        db.Users.Add(user);

        db.RefreshTokens.Add(new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            TokenHash = TestHelpers.ComputeHashForTest("expired-token"),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-20),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(-1)
        });

        await db.SaveChangesAsync();

        var service = new TokenService(config, userManager.Object, db);

        var result = await service.RefreshAsync("expired-token");

        result.Should().BeNull();
    }

    [Fact]
    public async Task RefreshAsync_ShouldRevokeAllTokens_WhenRevokedTokenIsReused()
    {
        using var db = CreateDbContext(nameof(RefreshAsync_ShouldRevokeAllTokens_WhenRevokedTokenIsReused));
        var config = CreateConfiguration();
        var userManager = TestHelpers.CreateUserManagerMock();
        var user = CreateTestUser();

        db.Users.Add(user);

        var revokedToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            TokenHash = TestHelpers.ComputeHashForTest("revoked-token"),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(10),
            RevokedAtUtc = DateTime.UtcNow
        };

        var activeToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            TokenHash = TestHelpers.ComputeHashForTest("active-token"),
            CreatedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(10)
        };

        db.RefreshTokens.AddRange(revokedToken, activeToken);
        await db.SaveChangesAsync();

        var service = new TokenService(config, userManager.Object, db);

        var result = await service.RefreshAsync("revoked-token");

        result.Should().BeNull();

        var userTokens = await db.RefreshTokens
            .Where(t => t.UserId == TestUserId)
            .ToListAsync();

        userTokens.Should().OnlyContain(t => t.RevokedAtUtc != null);
    }
}