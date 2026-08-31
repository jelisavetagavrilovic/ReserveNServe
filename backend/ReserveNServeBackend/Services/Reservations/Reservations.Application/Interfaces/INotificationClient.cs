namespace Reservations.Application.Interfaces;

public interface INotificationClient
{
    Task SendReservationConfirmedAsync(ReservationConfirmedNotification notification);
    Task SendReservationCancelledAsync(ReservationCancelledNotification notification);
    Task SendReservationRefundedAsync(ReservationRefundedNotification notification);
}

public record ReservationConfirmedNotification(
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
    IReadOnlyList<ReservationNotificationOrderItem> Orders,
    string? ReceiptUrl);

public record ReservationNotificationOrderItem(
    string FoodName,
    decimal Price,
    int Quantity,
    decimal Total);
    
public record ReservationCancelledNotification(
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
    
public record ReservationRefundedNotification(
    Guid ReservationId,
    string Email,
    string RestaurantName,
    string RestaurantAddress,
    string RestaurantCity,
    DateOnly Date,
    TimeOnly StartTime,
    decimal Amount,
    string? ReceiptUrl);