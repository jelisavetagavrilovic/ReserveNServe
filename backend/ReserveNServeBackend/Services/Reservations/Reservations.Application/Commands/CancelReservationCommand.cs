using MediatR;
using Reservations.Application.DTOs;

namespace Reservations.Application.Commands;

public class CancelReservationCommand: IRequest<CommandResultDto>
{
    public Guid ReservationId { get; set; }
    
    public CancelReservationCommand(Guid reservationId)
    {
        ReservationId = reservationId;
    }
}