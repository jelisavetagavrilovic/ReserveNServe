using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Services;

public class UserContextService : IUserContextService
{
    public Guid GetCurrentUserId()
    {
        // tmp user id
        return Guid.Parse("11111111-1111-1111-1111-111111111111");
    }
}


/*
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
   
public class UserContextService : IUserContextService
{
   private readonly IHttpContextAccessor _httpContextAccessor;

   public UserContextService(IHttpContextAccessor httpContextAccessor)
   {
       _httpContextAccessor = httpContextAccessor;
   }

   public Guid GetCurrentUserId()
   {
       var userIdClaim = _httpContextAccessor.HttpContext?
           .User?
           .FindFirst(ClaimTypes.NameIdentifier)?.Value;

       if (userIdClaim == null)
           throw new UnauthorizedAccessException("User is not authenticated.");

       return Guid.Parse(userIdClaim);
   }
}
*/