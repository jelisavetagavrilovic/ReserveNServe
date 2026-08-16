using Reservations.Domain.ValueObjects;

namespace Reservations.Application.DTOs.Responses;

public class ReservationResponse
{
    public Guid Id { get; set; }
    public int RestaurantId { get; set; }
    public string RestaurantName { get; set; } = string.Empty;
    public string RestaurantAddress { get; set; } = string.Empty;
    public string RestaurantCity { get; set; } = string.Empty;
    public int TableGroupId { get; set; }
    public string TableLocation { get; set; } = string.Empty;
    public int TableSeats { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public int GuestNumber { get; set; }
    public string? ServingTime { get; set; }
    public decimal TotalAmount { get; set; }
    public List<OrderResponse> Orders { get; set; } = [];
    public ReservationStatus Status { get; set; }
    public ReservationPaymentStatus PaymentStatus { get; set; }
}