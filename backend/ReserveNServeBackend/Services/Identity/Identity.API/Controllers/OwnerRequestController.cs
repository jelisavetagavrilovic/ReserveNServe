using Identity.API.Data;
using Identity.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

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

        if (userId is null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user is null) return Unauthorized();

        if (await _userManager.IsInRoleAsync(user, "RestaurantOwner"))
            return BadRequest("You are already a RestaurantOwner.");

        if (user.OwnerRequestPending)
            return BadRequest("Owner request is already pending.");

        user.OwnerRequestPending = true;
        user.OwnerRequestedAtUtc = DateTime.UtcNow;

        await _userManager.UpdateAsync(user);

        return Accepted(new { message = "Owner request submitted." });
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingOwnerRequests()
    {
        var pending = await _userManager.Users
            .Where(u => u.OwnerRequestPending)
            .Select(u => new { u.Email, u.UserName, u.OwnerRequestedAtUtc })
            .ToListAsync();

        return Ok(pending);
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("requests/approve")]
    public async Task<IActionResult> ApproveRestaurantOwner(ApproveOwnerRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null) return NotFound("User not found.");

        if (await _userManager.IsInRoleAsync(user, "RestaurantOwner"))
            return BadRequest("User is already a RestaurantOwner.");

        if (!user.OwnerRequestPending)
            return BadRequest("This user does not have a pending owner request.");

        var addRole = await _userManager.AddToRoleAsync(user, "RestaurantOwner");
        if (!addRole.Succeeded)
            return BadRequest(addRole.Errors.Select(e => e.Description));

        user.OwnerRequestPending = false;
        user.OwnerRequestedAtUtc = null;
        await _userManager.UpdateAsync(user);

        return Ok(new { message = "User approved as RestaurantOwner." });
    }

    // Optional: owner-only test endpoint
    [Authorize(Roles = "RestaurantOwner")]
    [HttpGet("ping")]
    public IActionResult OwnerPing()
    {
        return Ok(new { ok = true, message = "You are RestaurantOwner ✅" });
    }
}