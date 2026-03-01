using System.ComponentModel.DataAnnotations;

namespace Identity.API.DTOs;

public record ApproveOwnerRequest([Required, EmailAddress] string Email);