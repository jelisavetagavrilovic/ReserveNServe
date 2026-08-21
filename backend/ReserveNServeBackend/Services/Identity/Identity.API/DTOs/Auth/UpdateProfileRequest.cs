using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs.Auth;

public record UpdateProfileRequest(
    [Required] string FullName,
    [Required, EmailAddress] string Email,
    string? Phone
);