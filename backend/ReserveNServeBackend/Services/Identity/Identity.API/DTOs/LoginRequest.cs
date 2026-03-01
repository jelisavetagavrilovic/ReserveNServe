using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password
);