using MassTransit;
using ReserveNServe.Contracts;
using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Clients;

public class NotificationClient : INotificationClient
{
    private readonly IPublishEndpoint _publishEndpoint;

    public NotificationClient(IPublishEndpoint publishEndpoint)
    {
        _publishEndpoint = publishEndpoint;
    }

    public Task SendReservationConfirmedAsync(ReservationConfirmedNotification notification)
    {
        var message = new ReservationConfirmed(
            notification.ReservationId,
            notification.Email,
            notification.RestaurantName,
            notification.RestaurantAddress,
            notification.RestaurantCity,
            notification.Date,
            notification.StartTime,
            notification.GuestNumber,
            notification.TableLocation,
            notification.ServingTime,
            notification.TotalAmount,
            notification.Orders.Select(o =>
                new ReservationOrderItem(o.FoodName, o.Price, o.Quantity, o.Total)).ToList(),
            notification.ReceiptUrl);

        return _publishEndpoint.Publish(message);
    }

    public Task SendReservationCancelledAsync(ReservationCancelledNotification notification)
    {
        var message = new ReservationCancelled(
            notification.ReservationId,
            notification.Email,
            notification.RestaurantName,
            notification.RestaurantAddress,
            notification.RestaurantCity,
            notification.Date,
            notification.StartTime,
            notification.GuestNumber,
            notification.TableLocation,
            notification.RefundExpected,
            notification.TotalAmount);

        return _publishEndpoint.Publish(message);
    }
    
    public Task SendReservationRefundedAsync(ReservationRefundedNotification notification)
    {
        var message = new ReservationRefunded(
            notification.ReservationId,
            notification.Email,
            notification.RestaurantName,
            notification.RestaurantAddress,
            notification.RestaurantCity,
            notification.Date,
            notification.StartTime,
            notification.Amount,
            notification.ReceiptUrl);

        return _publishEndpoint.Publish(message);
    }
}