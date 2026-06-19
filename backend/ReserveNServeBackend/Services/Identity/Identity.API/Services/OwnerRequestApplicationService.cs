using Identity.API.Data;
using Identity.API.DTOs;
using Identity.API.Services.Interfaces;
using Identity.API.Services.Results;
using MassTransit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReserveNServe.Contracts;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Identity.API.Services;

public class OwnerRequestApplicationService : IOwnerRequestApplicationService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<OwnerRequestApplicationService> _logger;

    public OwnerRequestApplicationService(
        UserManager<ApplicationUser> userManager,
        IPublishEndpoint publishEndpoint,
        ILogger<OwnerRequestApplicationService> logger)
    {
        _userManager = userManager;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task<AppResult> RequestRestaurantOwnerAsync(ClaimsPrincipal user)
    {
        var userId =
            user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Unauthorized." });
        }

        var appUser = await _userManager.FindByIdAsync(userId);
        if (appUser is null)
        {
            return new AppResult(StatusCodes.Status401Unauthorized, new { message = "Unauthorized." });
        }

        if (await _userManager.IsInRoleAsync(appUser, "RestaurantOwner"))
        {
            return new AppResult(StatusCodes.Status400BadRequest, new { message = "You are already a RestaurantOwner." });
        }

        if (appUser.OwnerRequestPending)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new { message = "Owner request is already pending." });
        }

        appUser.OwnerRequestPending = true;
        appUser.OwnerRequestedAtUtc = DateTime.UtcNow;

        var update = await _userManager.UpdateAsync(appUser);
        if (!update.Succeeded)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new
            {
                message = "Failed to submit owner request.",
                errors = update.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return new AppResult(StatusCodes.Status202Accepted, new { message = "Owner request submitted." });
    }

    public async Task<AppResult> GetPendingOwnerRequestsAsync()
    {
        var pending = await _userManager.Users
            .Where(u => u.OwnerRequestPending)
            .Select(u => new { u.Email, u.UserName, u.OwnerRequestedAtUtc })
            .ToListAsync();

        return new AppResult(StatusCodes.Status200OK, pending);
    }

    public async Task<AppResult> ApproveRestaurantOwnerAsync(ApproveOwnerRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return new AppResult(StatusCodes.Status404NotFound, new { message = "User not found." });
        }

        if (await _userManager.IsInRoleAsync(user, "RestaurantOwner"))
        {
            return new AppResult(StatusCodes.Status400BadRequest, new { message = "User is already a RestaurantOwner." });
        }

        if (!user.OwnerRequestPending)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new { message = "This user does not have a pending owner request." });
        }

        var addRole = await _userManager.AddToRoleAsync(user, "RestaurantOwner");
        if (!addRole.Succeeded)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new
            {
                message = "Failed to approve RestaurantOwner role.",
                errors = addRole.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        user.OwnerRequestPending = false;
        user.OwnerRequestedAtUtc = null;

        var update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            return new AppResult(StatusCodes.Status400BadRequest, new
            {
                message = "Role assigned, but failed to update owner request state.",
                errors = update.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        try
        {
            await _publishEndpoint.Publish(new OwnerRequestApproved(user.Email!, true, null));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish {EventName} event.", nameof(OwnerRequestApproved));
        }

        return new AppResult(StatusCodes.Status200OK, new { message = "User approved as RestaurantOwner." });
    }
}