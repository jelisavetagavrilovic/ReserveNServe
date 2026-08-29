namespace Reservations.Infrastructure.Messaging;

public class PaymentStatusChangedEvent
{
    public string ReservationId { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}