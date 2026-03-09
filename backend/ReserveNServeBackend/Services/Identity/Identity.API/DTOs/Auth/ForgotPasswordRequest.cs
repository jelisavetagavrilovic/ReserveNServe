using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs.Auth;

public record ForgotPasswordRequest(
    [Required, EmailAddress] string Email
);