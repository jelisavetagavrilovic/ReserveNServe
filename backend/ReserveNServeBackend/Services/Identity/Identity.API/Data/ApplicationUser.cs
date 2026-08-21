using Identity.API.Entities;
using Microsoft.AspNetCore.Identity;

namespace Identity.API.Data;


public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = default!;
    public List<RefreshToken> RefreshTokens { get; set; } = new();

    // Restaurant owner request tracking
    public bool OwnerRequestPending { get; set; } = false;
    public DateTime? OwnerRequestedAtUtc { get; set; }
}
