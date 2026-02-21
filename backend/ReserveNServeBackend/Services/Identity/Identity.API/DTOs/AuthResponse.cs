namespace Identity.API.DTOs
{
    public record AuthResponse(string AccessToken, DateTime ExpiresAtUtc);
}
