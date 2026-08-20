using Identity.API.DTOs;
using Identity.API.Services.Interfaces;
using Identity.API.Services.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Identity.API.Controllers;

[ApiController]
[Route("api/owners")]
public class OwnerRequestController : ControllerBase
{
    private readonly IOwnerRequestApplicationService _ownerRequests;

    public OwnerRequestController(IOwnerRequestApplicationService ownerRequests)
    {
        _ownerRequests = ownerRequests;
    }

    [Authorize]
    [HttpPost("requests")]
    public async Task<IActionResult> RequestRestaurantOwner()
    {
        var result = await _ownerRequests.RequestRestaurantOwnerAsync(User);
        return ToActionResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("requests")]
    public async Task<IActionResult> GetPendingOwnerRequests()
    {
        var result = await _ownerRequests.GetPendingOwnerRequestsAsync();
        return ToActionResult(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("requests/approve")]
    public async Task<IActionResult> ApproveRestaurantOwner(ApproveOwnerRequest request)
    {
        var result = await _ownerRequests.ApproveRestaurantOwnerAsync(request);
        return ToActionResult(result);
    }

    [Authorize(Policy = "OwnerOnly")]
    [HttpGet("ping")]
    public IActionResult OwnerPing()
    {
        return Ok(new { ok = true, message = "You are RestaurantOwner ✅" });
    }

    private IActionResult ToActionResult(AppResult result)
    {
        return StatusCode(result.StatusCode, result.Body);
    }
}