namespace Reservations.Application.DTOs.Requests;

public class UpdateReservationOrdersRequest
{
    public List<OrderRequest> Orders { get; set; } = [];
    public TimeOnly? ServingTime { get; set; }
}