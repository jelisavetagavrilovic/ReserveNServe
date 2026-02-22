using Identity.API.Data;

namespace Identity.API.Entities
{
    public class RefreshToken
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // FK to AspNetUsers (string key)
        public string UserId { get; set; } = default!;
        public ApplicationUser User { get; set; } = default!;

        public string Token { get; set; } = default!;

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAtUtc { get; set; }

        public DateTime? RevokedAtUtc { get; set; }
        public bool IsRevoked => RevokedAtUtc != null;

        public bool IsExpired => DateTime.UtcNow >= ExpiresAtUtc;
    }
}
