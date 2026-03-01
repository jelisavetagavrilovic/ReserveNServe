using Identity.API.Data;
using Identity.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/owners")]
public class OwnerRequestsController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;

    public OwnerRequestsController(UserManager<ApplicationUser> userManager)
    {
        _userManager = userManager;
    }

    [Authorize]
    [HttpPost("requests")]
    public async Task<IActionResult> RequestRestaurantOwner()
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

        if (userId is null)
            return Unauthorized(new { message = "Unauthorized." });

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
            return Unauthorized(new { message = "Unauthorized." });

        if (await _userManager.IsInRoleAsync(user, "RestaurantOwner"))
            return BadRequest(new { message = "You are already a RestaurantOwner." });

        if (user.OwnerRequestPending)
            return BadRequest(new { message = "Owner request is already pending." });

        user.OwnerRequestPending = true;
        user.OwnerRequestedAtUtc = DateTime.UtcNow;

        var update = await _userManager.UpdateAsync(user);
        if (!update.Succeeded)
        {
            return BadRequest(new
            {
                message = "Failed to submit owner request.",
                errors = update.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return Accepted(new { message = "Owner request submitted." });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingOwnerRequests()
    {
        var pending = await _userManager.Users
            .Where(u => u.OwnerRequestPending)
            .Select(u => new { u.Email, u.UserName, u.OwnerRequestedAtUtc })
            .ToListAsync();

        return Ok(pending);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("requests/approve")]
    public async Task<IActionResult> ApproveRestaurantOwner(ApproveOwnerRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return NotFound(new { message = "User not found." });

        if (await _userManager.IsInRoleAsync(user, "RestaurantOwner"))
            return BadRequest(new { message = "User is already a RestaurantOwner." });

        if (!user.OwnerRequestPending)
            return BadRequest(new { message = "This user does not have a pending owner request." });

        var addRole = await _userManager.AddToRoleAsync(user, "RestaurantOwner");
        if (!addRole.Succeeded)
        {
            return BadRequest(new
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
            return BadRequest(new
            {
                message = "Role assigned, but failed to update owner request state.",
                errors = update.Errors.Select(e => new { e.Code, e.Description })
            });
        }

        return Ok(new { message = "User approved as RestaurantOwner." });
    }

    
    [Authorize(Policy = "OwnerOnly")]
    [HttpGet("ping")]
    public IActionResult OwnerPing()
    {
        return Ok(new { ok = true, message = "You are RestaurantOwner ✅" });
    }
}