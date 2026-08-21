using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs;

public record RegisterRequest(
    [Required] string FullName,
    [Required, EmailAddress] string Email,
    [Required] string Phone,
    [Required, MinLength(8)] string Password
);