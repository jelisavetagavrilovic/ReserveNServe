using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs.Auth;

public record ResetPasswordRequest(
    [Required] string UserId,
    [Required] string Token,
    [Required, MinLength(8)] string NewPassword
);