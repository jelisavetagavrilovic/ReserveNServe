using MediatR;
using Reservations.Application.DTOs;

namespace Reservations.Application.Commands;

public class CreateReservationCommand : IRequest<CommandResultDto>
{
    // public Guid UserId { get; set; }
    public int RestaurantId { get; set; }
    public int TableGroupId { get; set; }
    // public DateTime StartTime { get; set; }
    public string Date  { get; set; }
    public string StartTime { get; set; }
    public int GuestNumber { get; set; }

    public TimeSpan? ServingTime { get; set; } // optional

    public List<OrderDto> Orders { get; set; } = new();
}