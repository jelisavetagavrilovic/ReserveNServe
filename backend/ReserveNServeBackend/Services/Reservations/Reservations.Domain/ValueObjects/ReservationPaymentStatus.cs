namespace Reservations.Domain.ValueObjects;

public enum ReservationPaymentStatus
{
    NotRequired,
    NotStarted,
    Pending,
    Succeeded,
    Failed,
    RefundPending,
    Refunded,
    RefundFailed
}