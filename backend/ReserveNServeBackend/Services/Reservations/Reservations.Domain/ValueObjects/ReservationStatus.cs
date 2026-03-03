namespace Reservations.Domain.ValueObjects;

public enum ReservationStatus
{
    Pending,
    Confirmed,
    PendingPayment,
    Cancelled,
    Completed,
    Failed
}