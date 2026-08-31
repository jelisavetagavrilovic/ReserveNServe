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

/// <summary>
/// Published when a reservation is successfully created.
/// </summary>
public record ReservationConfirmed(
    Guid ReservationId,
    string Email,
    string RestaurantName,
    string RestaurantAddress,
    string RestaurantCity,
    DateOnly Date,
    TimeOnly StartTime,
    int GuestNumber,
    string TableLocation,
    string? ServingTime,
    decimal TotalAmount,
    IReadOnlyList<ReservationOrderItem> Orders,
    string? ReceiptUrl);

public record ReservationOrderItem(
    string FoodName,
    decimal Price,
    int Quantity,
    decimal Total);

/// <summary>
/// Published when a reservation is canceled.
/// </summary>
public record ReservationCancelled(
    Guid ReservationId,
    string Email,
    string RestaurantName,
    string RestaurantAddress,
    string RestaurantCity,
    DateOnly Date,
    TimeOnly StartTime,
    int GuestNumber,
    string TableLocation,
    bool RefundExpected,
    decimal TotalAmount);
    
/// <summary>
/// Published when a reservation is refunded.
/// </summary>
public record ReservationRefunded(
    Guid ReservationId,
    string Email,
    string RestaurantName,
    string RestaurantAddress,
    string RestaurantCity,
    DateOnly Date,
    TimeOnly StartTime,
    decimal Amount,
    string? ReceiptUrl);