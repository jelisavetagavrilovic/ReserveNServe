namespace Reservations.Application.Interfaces;

public interface INotificationClient
{
    Task SendReservationConfirmedAsync(Guid reservationId);

    Task SendReservationCancelledAsync(Guid reservationId);
}