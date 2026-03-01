namespace Identity.API.DTOs.Auth
{
    public record ResetPasswordRequest(string UserId, string Token, string NewPassword);
}
