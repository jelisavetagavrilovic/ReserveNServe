using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs;

public record RefreshRequest([Required] string RefreshToken);