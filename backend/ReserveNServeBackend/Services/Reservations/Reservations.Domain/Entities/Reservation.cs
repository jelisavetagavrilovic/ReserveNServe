/// <summary>
/// Represents a restaurant reservation created by a user.
/// A reservation contains booking information, associated food orders,
/// and manages the reservation lifecycle through validation and
/// business operations.
/// </summary>

using Reservations.Domain.ValueObjects;

namespace Reservations.Domain.Entities;

public class Reservation
{
    public Guid Id { get; set; }
    public Guid UserId { get; private set; }
    public int RestaurantId { get; private set; }
    public int TableGroupId { get; private set; }
    public DateTime StartTime { get; private set; }
    public int GuestNumber { get; private set; }

    // Default reservation duration is 3 hours.
    public int DurationMinutes { get; private set; } = 180;

    // // Reservation end time.
    public DateTime EndTime { get; private set; }

    // Navigation property: food orders associated with this reservation.
    private readonly List<Order> _orders = new();
    public IReadOnlyList<Order> Orders => _orders.AsReadOnly();

    public TimeSpan? ServingTime { get; private set; }

    // Total price of all ordered items.
    public decimal TotalAmount { get; private set; }

    // Current reservation status.
    public ReservationStatus Status { get; private set; } = ReservationStatus.Pending;
    
    public Reservation(
        Guid userId,
        int restaurantId,
        int tableGroupId,
        DateTime startTime,
        DateTime endTime,
        int guestNumber,
        TimeSpan? servingTime)
    {
        UserId = userId;
        RestaurantId = restaurantId;
        TableGroupId = tableGroupId;
        StartTime = startTime;
        EndTime = endTime;
        GuestNumber = guestNumber;
        ServingTime = servingTime;

        DurationMinutes = (int)(endTime - startTime).TotalMinutes;
    }
    
    private Reservation()
    {
    }

    /// <summary>
    /// Determines whether the reservation can still be modified.
    /// A reservation cannot be modified if it has already started,
    /// has been cancelled, or has been completed.
    /// </summary>
    private bool CanBeModified()
    {
        return (Status == ReservationStatus.Pending ||
                Status == ReservationStatus.PendingPayment)
               && StartTime > DateTime.UtcNow;
    }

    /// <summary>
    /// Determines whether the reservation can be cancelled.
    /// A reservation can only be cancelled before its start time
    /// and while it is still active.
    /// </summary>
    private bool CanBeCancelled()
    {
        return Status != ReservationStatus.Completed &&
               Status != ReservationStatus.Cancelled &&
               StartTime > DateTime.UtcNow;
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
        DateTime newEndTime,
        int guestNumber,
        TimeSpan? servingTime)
    {
        if (!CanBeModified())
            throw new InvalidOperationException("Reservation cannot be modified.");

        TableGroupId = tableGroupId;
        StartTime = newStartTime;
        EndTime = newEndTime;
        DurationMinutes = (int)(newEndTime - newStartTime).TotalMinutes;
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
    
    public void AddOrders(IEnumerable<Order> orders)
    {
        foreach (var order in orders)
        {
            order.ReservationId = Id;
            _orders.Add(order);
        }

        RecalculateTotal();

        if (_orders.Any())
            MarkPendingPayment();
    }

    /// <summary>
    /// Replaces all existing food orders, recalculates the total amount,
    /// and updates the reservation status.
    /// </summary>
    public void ReplaceOrders(IEnumerable<Order> orders)
    {
        if (!CanBeModified())
            throw new InvalidOperationException("Reservation cannot be modified.");

        _orders.Clear();

        if (orders != null)
        {
            foreach (var order in orders)
            {
                order.ReservationId = Id;
                _orders.Add(order);
            }
        }

        RecalculateTotal();

        if (_orders.Any())
            MarkPendingPayment();
        else
            MarkPending();
    }
    
    /// <summary>
    /// Marks the reservation as awaiting payment.
    /// This state is used when the reservation contains food orders
    /// that must be paid before the reservation can be confirmed.
    /// </summary>
    private void MarkPendingPayment()
    {
        Status = ReservationStatus.PendingPayment;
    }
    
    /// <summary>
    /// Marks the reservation as pending.
    /// This state indicates that the reservation does not require
    /// payment and is still awaiting confirmation.
    /// </summary>
    private void MarkPending()
    {
        Status = ReservationStatus.Pending;
    }
    
    /// <summary>
    /// Marks the reservation as confirmed after a successful payment.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the reservation is not awaiting payment.
    /// </exception>
    public void Confirm()
    {
        if (Status != ReservationStatus.PendingPayment)
            throw new InvalidOperationException("Reservation is not awaiting payment.");

        Status = ReservationStatus.Confirmed;
    }
    
    /// <summary>
    /// Marks the reservation payment as failed.
    /// </summary>
    /// <exception cref="InvalidOperationException">
    /// Thrown when the reservation is not awaiting payment.
    /// </exception>
    public void MarkPaymentFailed()
    {
        if (Status != ReservationStatus.PendingPayment)
            throw new InvalidOperationException("Reservation is not awaiting payment.");

        Status = ReservationStatus.Failed;
    }

    /// <summary>
    /// Marks the reservation as completed after its scheduled end time.
    /// Only confirmed reservations can be completed.
    /// </summary>
    public void MarkCompleted()
    {
        if (Status != ReservationStatus.Confirmed)
            throw new InvalidOperationException("Only confirmed reservations can be completed.");

        if (EndTime > DateTime.UtcNow)
            throw new InvalidOperationException("Reservation has not ended yet.");

        Status = ReservationStatus.Completed;
    }

    /// <summary>
    /// Recalculates the total amount based on all current food orders.
    /// </summary>
    private void RecalculateTotal()
    {
        TotalAmount = _orders.Sum(order => order.Price * order.Quantity);
    }
}