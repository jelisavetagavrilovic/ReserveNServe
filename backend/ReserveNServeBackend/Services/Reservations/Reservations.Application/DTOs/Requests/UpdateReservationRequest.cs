namespace Reservations.Application.DTOs.Requests;

public class UpdateReservationRequest
{
    public int TableGroupId { get; set; }

    public DateOnly Date { get; set; }

    public TimeOnly StartTime { get; set; }

    public int GuestNumber { get; set; }

    public TimeOnly? ServingTime { get; set; }
}