namespace Reservations.Application.Interfaces;

public interface INotificationClient
{
    Task SendReservationConfirmedAsync(ReservationConfirmedNotification notification);
    Task SendReservationCancelledAsync(Guid reservationId);
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
    IReadOnlyList<ReservationNotificationOrderItem> Orders);

public record ReservationNotificationOrderItem(
    string FoodName,
    decimal Price,
    int Quantity,
    decimal Total);