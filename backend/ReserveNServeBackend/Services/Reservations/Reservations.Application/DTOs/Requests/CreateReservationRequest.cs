namespace Reservations.Application.DTOs.Requests;

public class CreateReservationRequest
{
    public int RestaurantId { get; set; }
    public int TableGroupId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public int GuestNumber { get; set; }
    public List<OrderRequest> Orders { get; set; } = [];
    public TimeOnly? ServingTime { get; set; }
}