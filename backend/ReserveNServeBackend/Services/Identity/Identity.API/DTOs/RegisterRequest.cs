using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password
);