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
                new ReservationOrderItem(o.FoodName, o.Price, o.Quantity, o.Total)).ToList());

        return _publishEndpoint.Publish(message);
    }

    public Task SendReservationCancelledAsync(Guid reservationId)
    {
        return Task.CompletedTask;
    }
}