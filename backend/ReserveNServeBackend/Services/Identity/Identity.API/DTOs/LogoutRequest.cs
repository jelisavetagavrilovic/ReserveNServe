using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs;

public record LogoutRequest([Required] string RefreshToken);