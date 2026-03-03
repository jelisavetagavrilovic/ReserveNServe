using Reservations.Domain.ValueObjects;

namespace Reservations.Domain.Entities;

public class Reservation
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }  
    public int RestaurantId { get; set; }
    public int TableGroupId { get; set; }
    public DateTime StartTime { get; set; }
    public int GuestNumber { get; set; }

    public int DurationMinutes { get; set; } = 180; // default 3h
    public DateTime EndTime => StartTime.Add(TimeSpan.FromMinutes(DurationMinutes));
    
    
    // navigation property: list of orders associated with this reservation
    public List<Order> Orders { get; set; } = new List<Order>();

    public TimeSpan? ServingTime { get; set; }
    public decimal TotalAmount { get; private set; }
    
    // reservation status
    public ReservationStatus Status { get; private set; } = ReservationStatus.Pending;
    
    
    /*
    // methods
    public bool CanBeModified()
    {
        if (Status == ReservationStatus.Completed)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return true;
    }
    public bool CanBeCancelled()
    {
        if (Status == ReservationStatus.Completed)
            return false;

        if (Status == ReservationStatus.Cancelled)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return true;
    }
    public void Cancel()
    {
        Status = ReservationStatus.Cancelled;
    }
    
    
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

    public void ReplaceOrders(List<Order> newOrders)
    {
        Orders = newOrders;
        TotalAmount = Orders.Sum(o => o.Price * o.Quantity);

        Status = Orders.Any()
            ? ReservationStatus.PendingPayment
            : ReservationStatus.Confirmed;
    }

    public void MarkCompleted()
    {
        if (Status == ReservationStatus.Confirmed &&
            EndTime <= DateTime.UtcNow)
        {
            Status = ReservationStatus.Completed;
        }
    }
    */
    
    // ---------- VALIDATION METHODS ----------
    public bool CanBeModified()
    {
        if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return true;
    }

    public bool CanBeCancelled()
    {
        if (Status == ReservationStatus.Completed || Status == ReservationStatus.Cancelled)
            return false;

        if (StartTime <= DateTime.UtcNow)
            return false;

        return true;
    }

    // ---------- ACTION METHODS ----------
    public void Cancel()
    {
        if (!CanBeCancelled())
            throw new InvalidOperationException("Reservation cannot be cancelled.");

        Status = ReservationStatus.Cancelled;
    }

    public void UpdateDetails(int tableGroupId, DateTime newStartTime, int guestNumber, TimeSpan? servingTime)
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

    public void ReplaceOrders(List<Order> newOrders)
    {
        Orders = newOrders ?? new List<Order>();
        RecalculateTotal();

        Status = Orders.Any()
            ? ReservationStatus.PendingPayment
            : ReservationStatus.Confirmed;
    }

    public void AddOrder(Order order)
    {
        if (order == null) throw new ArgumentNullException(nameof(order));

        Orders.Add(order);
        TotalAmount += order.Price * order.Quantity;
        Status = ReservationStatus.PendingPayment;
    }

    public void RemoveOrder(Order order)
    {
        if (order == null) throw new ArgumentNullException(nameof(order));

        Orders.Remove(order);
        RecalculateTotal();

        Status = Orders.Any() ? ReservationStatus.PendingPayment : ReservationStatus.Confirmed;
    }

    public void MarkCompleted()
    {
        if ((Status == ReservationStatus.Confirmed || Status == ReservationStatus.PendingPayment) &&
            EndTime <= DateTime.UtcNow)
        {
            Status = ReservationStatus.Completed;
        }
    }

    // ---------- PRIVATE HELPERS ----------
    private void RecalculateTotal()
    {
        TotalAmount = Orders.Sum(o => o.Price * o.Quantity);
    }
}