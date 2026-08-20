using Identity.API.DTOs;
using Identity.API.Services.Results;
using System.Security.Claims;

namespace Identity.API.Services.Interfaces;

public interface IOwnerRequestApplicationService
{
    Task<AppResult> RequestRestaurantOwnerAsync(ClaimsPrincipal user);
    Task<AppResult> GetPendingOwnerRequestsAsync();
    Task<AppResult> ApproveRestaurantOwnerAsync(ApproveOwnerRequest request);
}