namespace Identity.API.DTOs.Auth
{
    public record ConfirmEmailRequest(string UserId, string Token);
}
