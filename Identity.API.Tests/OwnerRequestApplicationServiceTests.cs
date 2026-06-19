using System.Security.Claims;
using FluentAssertions;
using Identity.API.Data;
using Identity.API.DTOs;
using Identity.API.Services;
using MassTransit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace Identity.API.Tests;

public class OwnerRequestApplicationServiceTests
{
    private static OwnerRequestApplicationService CreateService(Mock<UserManager<ApplicationUser>> userManager)
        => new OwnerRequestApplicationService(
            userManager.Object,
            Mock.Of<IPublishEndpoint>(),
            Mock.Of<ILogger<OwnerRequestApplicationService>>());

    [Fact]
    public async Task RequestRestaurantOwnerAsync_ShouldReturn401_WhenNoUserIdClaim()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        var service = CreateService(userManager);

        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        var result = await service.RequestRestaurantOwnerAsync(principal);

        result.StatusCode.Should().Be(StatusCodes.Status401Unauthorized);
    }

    [Fact]
    public async Task RequestRestaurantOwnerAsync_ShouldReturn400_WhenAlreadyOwner()
    {
        var user = new ApplicationUser
        {
            Id = "u1",
            Email = "owner@test.com"
        };

        var userManager = TestHelpers.CreateUserManagerMock();
        userManager.Setup(x => x.FindByIdAsync("u1")).ReturnsAsync(user);
        userManager.Setup(x => x.IsInRoleAsync(user, "RestaurantOwner")).ReturnsAsync(true);

        var service = CreateService(userManager);

        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "u1")
        }, "test"));

        var result = await service.RequestRestaurantOwnerAsync(principal);

        result.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
    }

    [Fact]
    public async Task RequestRestaurantOwnerAsync_ShouldReturn202_WhenSuccessful()
    {
        var user = new ApplicationUser
        {
            Id = "u1",
            Email = "user@test.com",
            OwnerRequestPending = false
        };

        var userManager = TestHelpers.CreateUserManagerMock();
        userManager.Setup(x => x.FindByIdAsync("u1")).ReturnsAsync(user);
        userManager.Setup(x => x.IsInRoleAsync(user, "RestaurantOwner")).ReturnsAsync(false);
        userManager.Setup(x => x.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

        var service = CreateService(userManager);

        var principal = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, "u1")
        }, "test"));

        var result = await service.RequestRestaurantOwnerAsync(principal);

        result.StatusCode.Should().Be(StatusCodes.Status202Accepted);
    }

    [Fact]
    public async Task ApproveRestaurantOwnerAsync_ShouldReturn404_WhenUserDoesNotExist()
    {
        var userManager = TestHelpers.CreateUserManagerMock();
        userManager.Setup(x => x.FindByEmailAsync("missing@test.com"))
            .ReturnsAsync((ApplicationUser?)null);

        var service = CreateService(userManager);

        var result = await service.ApproveRestaurantOwnerAsync(new ApproveOwnerRequest("missing@test.com"));

        result.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [Fact]
    public async Task ApproveRestaurantOwnerAsync_ShouldAddRole_AndClearPendingFlags()
    {
        var user = new ApplicationUser
        {
            Id = "u1",
            Email = "user@test.com",
            OwnerRequestPending = true,
            OwnerRequestedAtUtc = DateTime.UtcNow.AddHours(-2)
        };

        var userManager = TestHelpers.CreateUserManagerMock();
        userManager.Setup(x => x.FindByEmailAsync("user@test.com")).ReturnsAsync(user);
        userManager.Setup(x => x.IsInRoleAsync(user, "RestaurantOwner")).ReturnsAsync(false);
        userManager.Setup(x => x.AddToRoleAsync(user, "RestaurantOwner")).ReturnsAsync(IdentityResult.Success);
        userManager.Setup(x => x.UpdateAsync(user)).ReturnsAsync(IdentityResult.Success);

        var service = CreateService(userManager);

        var result = await service.ApproveRestaurantOwnerAsync(new ApproveOwnerRequest("user@test.com"));

        result.StatusCode.Should().Be(StatusCodes.Status200OK);
        user.OwnerRequestPending.Should().BeFalse();
        user.OwnerRequestedAtUtc.Should().BeNull();

        userManager.Verify(x => x.AddToRoleAsync(user, "RestaurantOwner"), Times.Once);
        userManager.Verify(x => x.UpdateAsync(user), Times.Once);
    }
}