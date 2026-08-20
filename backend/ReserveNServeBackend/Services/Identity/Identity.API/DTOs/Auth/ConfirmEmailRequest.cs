using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs.Auth;

public record ConfirmEmailRequest(
    [Required] string UserId,
    [Required] string Token
);