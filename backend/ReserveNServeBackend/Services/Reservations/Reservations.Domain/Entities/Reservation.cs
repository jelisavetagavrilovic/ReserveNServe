/// <summary>
/// Represents a restaurant reservation created by a user.
/// A reservation contains booking information, associated food orders,
/// and manages reservation and food payment state through domain operations.
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

    public int DurationMinutes { get; private set; } = 180;

    public DateTime EndTime { get; private set; }

    private readonly List<Order> _orders = new();

    public IReadOnlyList<Order> Orders => _orders.AsReadOnly();

    public TimeSpan? ServingTime { get; private set; }

    public decimal TotalAmount { get; private set; }

    /// <summary>
    /// Represents the lifecycle of the table reservation itself.
    /// </summary>
    public ReservationStatus Status { get; private set; }
        = ReservationStatus.Confirmed;

    /// <summary>
    /// Represents the payment state of the food preorder.
    /// Payment processing itself belongs to the Payment service.
    /// </summary>
    public ReservationPaymentStatus PaymentStatus { get; private set; }
        = ReservationPaymentStatus.NotRequired;


    /// <summary>
    /// Creates a confirmed restaurant reservation.
    /// Payment is handled separately if food has been pre-ordered.
    /// </summary>
    public Reservation(
        Guid userId,
        int restaurantId,
        int tableGroupId,
        DateTime startTime,
        DateTime endTime,
        int guestNumber,
        TimeSpan? servingTime)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException(
                "User ID cannot be empty.",
                nameof(userId));

        if (restaurantId <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(restaurantId));

        if (tableGroupId <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(tableGroupId));

        if (guestNumber <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(guestNumber));

        if (endTime <= startTime)
            throw new ArgumentException(
                "Reservation end time must be after start time.");

        UserId = userId;
        RestaurantId = restaurantId;
        TableGroupId = tableGroupId;
        StartTime = startTime;
        EndTime = endTime;
        GuestNumber = guestNumber;

        DurationMinutes =
            (int)(endTime - startTime).TotalMinutes;

        SetServingTime(servingTime);
    }


    private Reservation()
    {
    }


    /// <summary>
    /// Determines whether reservation details and food orders
    /// can still be modified.
    /// </summary>
    private bool CanBeModified()
    {
        if (Status != ReservationStatus.Confirmed)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return PaymentStatus is
            ReservationPaymentStatus.NotRequired or
            ReservationPaymentStatus.NotStarted or
            ReservationPaymentStatus.Failed;
    }


    /// <summary>
    /// Determines whether the reservation can be cancelled.
    /// A reservation cannot be cancelled while payment or refund
    /// processing is in progress.
    /// </summary>
    private bool CanBeCancelled()
    {
        if (Status != ReservationStatus.Confirmed)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return PaymentStatus != ReservationPaymentStatus.Pending
               && PaymentStatus != ReservationPaymentStatus.RefundPending;
    }


    /// <summary>
    /// Indicates whether cancelling this reservation requires
    /// a refund of a successful food payment.
    /// </summary>
    public bool RequiresRefund =>
        PaymentStatus == ReservationPaymentStatus.Succeeded;


    /// <summary>
    /// Cancels the reservation.
    /// Refund processing is coordinated by the Application layer.
    /// </summary>
    public void Cancel()
    {
        if (!CanBeCancelled())
        {
            throw new InvalidOperationException(
                "Reservation cannot be cancelled.");
        }

        Status = ReservationStatus.Cancelled;
    }


    /// <summary>
    /// Updates reservation details.
    /// </summary>
    public void UpdateDetails(
        int tableGroupId,
        DateTime newStartTime,
        DateTime newEndTime,
        int guestNumber,
        TimeSpan? servingTime)
    {
        if (!CanBeModified())
        {
            throw new InvalidOperationException(
                "Reservation cannot be modified.");
        }

        if (tableGroupId <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(tableGroupId));

        if (guestNumber <= 0)
            throw new ArgumentOutOfRangeException(
                nameof(guestNumber));

        if (newEndTime <= newStartTime)
            throw new ArgumentException(
                "Reservation end time must be after start time.");

        TableGroupId = tableGroupId;
        StartTime = newStartTime;
        EndTime = newEndTime;
        GuestNumber = guestNumber;

        DurationMinutes =
            (int)(newEndTime - newStartTime).TotalMinutes;

        SetServingTime(servingTime);

        ResetPaymentAfterModification();
    }


    /// <summary>
    /// Replaces all food orders associated with the reservation
    /// and recalculates the total amount.
    /// </summary>
    public void SetOrders(IEnumerable<Order> orders)
    {
        if (!CanBeModified())
        {
            throw new InvalidOperationException(
                "Reservation cannot be modified.");
        }

        orders ??= Enumerable.Empty<Order>();

        _orders.Clear();

        foreach (var order in orders)
        {
            _orders.Add(order);
        }

        RecalculateTotal();

        ResetPaymentAfterModification();
    }


    /// <summary>
    /// Determines whether payment for the food preorder
    /// can currently be started or retried.
    /// </summary>
    public bool CanStartPayment()
    {
        if (Status != ReservationStatus.Confirmed)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        if (!_orders.Any() || TotalAmount <= 0)
            return false;

        return PaymentStatus is
            ReservationPaymentStatus.NotStarted or
            ReservationPaymentStatus.Failed;
    }


    /// <summary>
    /// Marks food payment as being processed.
    /// Used both for the initial payment and payment retry.
    /// </summary>
    public void StartPayment()
    {
        if (!CanStartPayment())
        {
            throw new InvalidOperationException(
                "Payment cannot be started for this reservation.");
        }

        PaymentStatus =
            ReservationPaymentStatus.Pending;
    }


    /// <summary>
    /// Marks food payment as successful.
    /// </summary>
    public void MarkPaymentSucceeded()
    {
        if (PaymentStatus == ReservationPaymentStatus.Succeeded)
            return;

        if (PaymentStatus != ReservationPaymentStatus.Pending)
        {
            throw new InvalidOperationException(
                "Payment is not pending.");
        }

        PaymentStatus =
            ReservationPaymentStatus.Succeeded;
    }


    /// <summary>
    /// Marks food payment as failed.
    /// The table reservation remains confirmed.
    /// Payment can be retried afterwards.
    /// </summary>
    public void MarkPaymentFailed()
    {
        if (PaymentStatus == ReservationPaymentStatus.Failed)
            return;

        if (PaymentStatus != ReservationPaymentStatus.Pending)
        {
            throw new InvalidOperationException(
                "Payment is not pending.");
        }

        PaymentStatus =
            ReservationPaymentStatus.Failed;
    }


    /// <summary>
    /// Marks a successful payment as awaiting refund.
    /// A failed refund may also be retried.
    /// </summary>
    public void MarkRefundPending()
    {
        if (PaymentStatus ==
            ReservationPaymentStatus.RefundPending)
        {
            return;
        }

        if (PaymentStatus != ReservationPaymentStatus.Succeeded &&
            PaymentStatus != ReservationPaymentStatus.RefundFailed)
        {
            throw new InvalidOperationException(
                "Refund cannot be started.");
        }

        PaymentStatus =
            ReservationPaymentStatus.RefundPending;
    }
    
    /// <summary>
    /// Marks the food payment as successfully refunded.
    /// </summary>
    public void MarkPaymentRefunded()
    {
        if (PaymentStatus ==
            ReservationPaymentStatus.Refunded)
        {
            return;
        }

        if (PaymentStatus !=
            ReservationPaymentStatus.RefundPending)
        {
            throw new InvalidOperationException(
                "Payment is not awaiting refund.");
        }

        PaymentStatus =
            ReservationPaymentStatus.Refunded;
    }
    
    /// <summary>
    /// Marks the refund attempt as failed.
    /// The refund may be retried afterwards.
    /// </summary>
    public void MarkRefundFailed()
    {
        if (PaymentStatus ==
            ReservationPaymentStatus.RefundFailed)
        {
            return;
        }

        if (PaymentStatus !=
            ReservationPaymentStatus.RefundPending)
        {
            throw new InvalidOperationException(
                "Refund is not pending.");
        }

        PaymentStatus =
            ReservationPaymentStatus.RefundFailed;
    }


    /// <summary>
    /// Marks the reservation as completed after
    /// its scheduled end time.
    /// </summary>
    public void MarkCompleted()
    {
        if (Status != ReservationStatus.Confirmed)
        {
            throw new InvalidOperationException(
                "Only confirmed reservations can be completed.");
        }

        if (EndTime > DateTime.UtcNow)
        {
            throw new InvalidOperationException(
                "Reservation has not ended yet.");
        }

        Status = ReservationStatus.Completed;
    }


    private void RecalculateTotal()
    {
        TotalAmount =
            _orders.Sum(order =>
                order.Price * order.Quantity);
    }


    /// <summary>
    /// Any allowed reservation/order modification invalidates
    /// the previous failed or not-started payment state.
    /// </summary>
    private void ResetPaymentAfterModification()
    {
        PaymentStatus = _orders.Any()
            ? ReservationPaymentStatus.NotStarted
            : ReservationPaymentStatus.NotRequired;
    }


    private void SetServingTime(
        TimeSpan? servingTime)
    {
        if (!servingTime.HasValue)
        {
            ServingTime = null;
            return;
        }

        var start = StartTime.TimeOfDay;
        var end = EndTime.TimeOfDay;

        ServingTime =
            servingTime.Value >= start &&
            servingTime.Value <= end
                ? servingTime
                : null;
    }
}