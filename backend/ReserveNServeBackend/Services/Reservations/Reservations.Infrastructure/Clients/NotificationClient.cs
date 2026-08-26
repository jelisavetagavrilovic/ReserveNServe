using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Clients;

public class NotificationClient : INotificationClient
{
    public Task SendReservationConfirmedAsync(Guid reservationId)
    {
        return Task.CompletedTask;
    }

    public Task SendReservationCancelledAsync(Guid reservationId)
    {
        return Task.CompletedTask;
    }
}