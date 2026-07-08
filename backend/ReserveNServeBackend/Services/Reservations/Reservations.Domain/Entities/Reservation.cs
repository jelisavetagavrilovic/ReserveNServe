// using Reservations.Domain.ValueObjects;
//
// namespace Reservations.Domain.Entities;
//
// public class Reservation
// {
//     public Guid Id { get; set; }
//     public Guid UserId { get; set; }  
//     public int RestaurantId { get; set; }
//     public int TableGroupId { get; set; }
//     public DateTime StartTime { get; set; }
//     public int GuestNumber { get; set; }
//
//     public int DurationMinutes { get; set; } = 180; // default 3h
//     public DateTime EndTime => StartTime.Add(TimeSpan.FromMinutes(DurationMinutes));
//     
//     
//     // navigation property: list of orders associated with this reservation
//     public List<Order> Orders { get; set; } = new List<Order>();
//
//     public TimeSpan? ServingTime { get; set; }
//     public decimal TotalAmount { get; private set; }
//     
//     // reservation status
//     public ReservationStatus Status { get; private set; } = ReservationStatus.Pending;
//     
//     
//     /*
//     // methods
//     public bool CanBeModified()
//     {
//         if (Status == ReservationStatus.Completed)
//             return false;
//
//         if (StartTime <= DateTime.UtcNow)
//             return false;
//
//         return true;
//     }
//     public bool CanBeCancelled()
//     {
//         if (Status == ReservationStatus.Completed)
//             return false;
//
//         if (Status == ReservationStatus.Cancelled)
//             return false;
//
//         if (StartTime <= DateTime.UtcNow)
//             return false;
//
//         return true;
//     }
//     public void Cancel()
//     {
//         Status = ReservationStatus.Cancelled;
//     }
//     
//     
//     public void UpdateDetails(
//         int tableGroupId,
//         DateTime newStartTime,
//         int guestNumber,
//         TimeSpan? servingTime)
//     {
//         if (!CanBeModified())
//             throw new InvalidOperationException("Reservation cannot be modified.");
//
//         TableGroupId = tableGroupId;
//         StartTime = newStartTime;
//         GuestNumber = guestNumber;
//
//         var start = StartTime.TimeOfDay;
//         var end = EndTime.TimeOfDay;
//
//         ServingTime =
//             servingTime.HasValue &&
//             servingTime.Value >= start &&
//             servingTime.Value <= end
//                 ? servingTime
//                 : null;
//     }
//
//     public void ReplaceOrders(List<Order> newOrders)
//     {
//         Orders = newOrders;
//         TotalAmount = Orders.Sum(o => o.Price * o.Quantity);
//
//         Status = Orders.Any()
//             ? ReservationStatus.PendingPayment
//             : ReservationStatus.Confirmed;
//     }
//
//     public void MarkCompleted()
//     {
//         if (Status == ReservationStatus.Confirmed &&
//             EndTime <= DateTime.UtcNow)
//         {
//             Status = ReservationStatus.Completed;
//         }
//     }
//     */
//     
//     // ---------- VALIDATION METHODS ----------
//     public bool CanBeModified()
//     {
//         if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
//             return false;
//
//         if (StartTime <= DateTime.UtcNow)
//             return false;
//
//         return true;
//     }
//
//     public bool CanBeCancelled()
//     {
//         if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
//             return false;
//
//         if (StartTime <= DateTime.UtcNow)
//             return false;
//
//         return true;
//     }
//
//     // ---------- ACTION METHODS ----------
//     public void Cancel()
//     {
//         if (!CanBeCancelled())
//             throw new InvalidOperationException("Reservation cannot be cancelled.");
//
//         Status = ReservationStatus.Cancelled;
//     }
//
//     public void UpdateDetails(int tableGroupId, DateTime newStartTime, int guestNumber, TimeSpan? servingTime)
//     {
//         if (!CanBeModified())
//             throw new InvalidOperationException("Reservation cannot be modified.");
//
//         TableGroupId = tableGroupId;
//         StartTime = newStartTime;
//         GuestNumber = guestNumber;
//
//         var start = StartTime.TimeOfDay;
//         var end = EndTime.TimeOfDay;
//
//         ServingTime =
//             servingTime.HasValue &&
//             servingTime.Value >= start &&
//             servingTime.Value <= end
//                 ? servingTime
//                 : null;
//     }
//
//     public void ReplaceOrders(List<Order> newOrders)
//     {
//         Orders = newOrders ?? new List<Order>();
//         RecalculateTotal();
//
//         Status = Orders.Any()
//             ? ReservationStatus.PendingPayment
//             : ReservationStatus.Confirmed;
//     }
//
//     public void AddOrder(Order order)
//     {
//         if (order == null) throw new ArgumentNullException(nameof(order));
//
//         Orders.Add(order);
//         TotalAmount += order.Price * order.Quantity;
//         Status = ReservationStatus.PendingPayment;
//     }
//
//     public void RemoveOrder(Order order)
//     {
//         if (order == null) throw new ArgumentNullException(nameof(order));
//
//         Orders.Remove(order);
//         RecalculateTotal();
//
//         Status = Orders.Any() ? ReservationStatus.PendingPayment : ReservationStatus.Confirmed;
//     }
//
//     public void MarkCompleted()
//     {
//         if ((Status == ReservationStatus.Confirmed || Status == ReservationStatus.PendingPayment) &&
//             EndTime <= DateTime.UtcNow)
//         {
//             Status = ReservationStatus.Completed;
//         }
//     }
//
//     // ---------- PRIVATE HELPERS ----------
//     private void RecalculateTotal()
//     {
//         TotalAmount = Orders.Sum(o => o.Price * o.Quantity);
//     }
// }


using Reservations.Domain.ValueObjects;

namespace Reservations.Domain.Entities;

/// <summary>
/// Represents a restaurant reservation created by a user.
/// A reservation contains booking information, associated food orders,
/// and manages the reservation lifecycle through validation and
/// business operations.
/// </summary>
public class Reservation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public int RestaurantId { get; set; }
    public int TableGroupId { get; set; }
    public DateTime StartTime { get; set; }
    public int GuestNumber { get; set; }

    // Default reservation duration is 3 hours.
    public int DurationMinutes { get; set; } = 180;

    // Computed reservation end time.
    public DateTime EndTime => StartTime.AddMinutes(DurationMinutes);

    // Navigation property: food orders associated with this reservation.
    public List<Order> Orders { get; set; } = new();

    public TimeSpan? ServingTime { get; set; }

    // Total price of all ordered items.
    public decimal TotalAmount { get; private set; }

    // Current reservation status.
    public ReservationStatus Status { get; private set; } = ReservationStatus.Pending;

    /// <summary>
    /// Determines whether the reservation can still be modified.
    /// A reservation cannot be modified if it has already started,
    /// has been cancelled, or has been completed.
    /// </summary>
    public bool CanBeModified()
    {
        if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return true;
    }

    /// <summary>
    /// Determines whether the reservation can be cancelled.
    /// A reservation can only be cancelled before its start time
    /// and while it is still active.
    /// </summary>
    public bool CanBeCancelled()
    {
        if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return true;
    }

    /// <summary>
    /// Cancels the reservation if cancellation is allowed.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the reservation cannot be cancelled.
    /// </exception>
    public void Cancel()
    {
        if (!CanBeCancelled())
            throw new InvalidOperationException("Reservation cannot be cancelled.");

        Status = ReservationStatus.Cancelled;
    }

    /// <summary>
    /// Updates the reservation details, including the table group,
    /// start time, guest count, and optional serving time.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the reservation cannot be modified.
    /// </exception>
    public void UpdateDetails(
        int tableGroupId,
        DateTime newStartTime,
        int guestNumber,
        TimeSpan? servingTime)
    {
        if (!CanBeModified())
            throw new InvalidOperationException("Reservation cannot be modified.");

        TableGroupId = tableGroupId;
        StartTime = newStartTime;
        GuestNumber = guestNumber;

        var start = StartTime.TimeOfDay;
        var end = EndTime.TimeOfDay;

        ServingTime =
            servingTime.HasValue &&
            servingTime.Value >= start &&
            servingTime.Value <= end
                ? servingTime
                : null;
    }

    /// <summary>
    /// Replaces all existing food orders, recalculates the total amount,
    /// and updates the reservation status.
    /// </summary>
    public void ReplaceOrders(List<Order> newOrders)
    {
        Orders = newOrders ?? new List<Order>();

        RecalculateTotal();

        Status = Orders.Any()
            ? ReservationStatus.PendingPayment
            : ReservationStatus.Confirmed;
    }

    /// <summary>
    /// Adds a food order to the reservation and updates
    /// the total amount and reservation status.
    /// </summary>
    /// <exception cref="ArgumentNullException">
    /// Thrown when the provided order is null.
    /// </exception>
    public void AddOrder(Order order)
    {
        if (order == null)
            throw new ArgumentNullException(nameof(order));

        Orders.Add(order);
        TotalAmount += order.Price * order.Quantity;

        Status = ReservationStatus.PendingPayment;
    }

    /// <summary>
    /// Removes a food order from the reservation, recalculates
    /// the total amount, and updates the reservation status.
    /// </summary>
    /// <exception cref="ArgumentNullException">
    /// Thrown when the provided order is null.
    /// </exception>
    public void RemoveOrder(Order order)
    {
        if (order == null)
            throw new ArgumentNullException(nameof(order));

        Orders.Remove(order);

        RecalculateTotal();

        Status = Orders.Any()
            ? ReservationStatus.PendingPayment
            : ReservationStatus.Confirmed;
    }

    /// <summary>
    /// Marks the reservation as completed if it has ended
    /// and is currently confirmed or awaiting payment.
    /// </summary>
    public void MarkCompleted()
    {
        if ((Status == ReservationStatus.Confirmed ||
             Status == ReservationStatus.PendingPayment) &&
            EndTime <= DateTime.UtcNow)
        {
            Status = ReservationStatus.Completed;
        }
    }

    /// <summary>
    /// Recalculates the total amount based on all current food orders.
    /// </summary>
    private void RecalculateTotal()
    {
        TotalAmount = Orders.Sum(o => o.Price * o.Quantity);
    }
}