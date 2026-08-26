namespace ReserveNServe.Contracts;

/// <summary>
/// Published when a new user registers and must confirm their email address.
/// The token is the raw ASP.NET Identity token; the consumer is responsible for
/// URL-encoding it when building the confirmation link.
/// </summary>
public record UserRegistered(string UserId, string Email, string ConfirmationToken);

/// <summary>
/// Published when a user requests a password reset.
/// The token is the raw ASP.NET Identity token; the consumer is responsible for
/// URL-encoding it when building the reset link.
/// </summary>
public record PasswordResetRequested(string UserId, string Email, string ResetToken);

/// <summary>
/// Published when an admin processes a restaurant owner request.
/// </summary>
public record OwnerRequestApproved(string Email, bool Approved, string? Reason);
