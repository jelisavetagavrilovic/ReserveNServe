// namespace Reservations.Domain.ValueObjects;
//
// public enum ReservationStatus
// {
//     Pending,
//     Confirmed,
//     PendingPayment,
//     Cancelled,
//     Completed,
//     Failed
// }

namespace Reservations.Domain.ValueObjects;

/// <summary>
/// Represents the current lifecycle state of a reservation.
/// The status changes based on reservation actions such as
/// confirmation, payment, cancellation, and completion.
/// </summary>
public enum ReservationStatus
{
    /// <summary>
    /// Reservation has been created but is not yet confirmed.
    /// </summary>
    Pending,

    /// <summary>
    /// Reservation has been confirmed by the restaurant.
    /// </summary>
    Confirmed,

    /// <summary>
    /// Reservation contains orders that require payment.
    /// </summary>
    PendingPayment,

    /// <summary>
    /// Reservation has been cancelled.
    /// </summary>
    Cancelled,

    /// <summary>
    /// Reservation has been completed after its scheduled time.
    /// </summary>
    Completed,

    /// <summary>
    /// Reservation processing has failed.
    /// </summary>
    Failed
}