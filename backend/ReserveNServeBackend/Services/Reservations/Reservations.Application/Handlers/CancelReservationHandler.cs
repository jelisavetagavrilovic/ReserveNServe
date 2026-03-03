using MediatR;
using Reservations.Application.Commands;
using Reservations.Application.DTOs;
using Reservations.Application.Interfaces;

namespace Reservations.Application.Handlers;

public class CancelReservationHandler
    : IRequestHandler<CancelReservationCommand, CommandResultDto>
{
    private readonly IReservationRepository _repository;
    private readonly IUserContextService _userContext;

    public CancelReservationHandler(
        IReservationRepository repository,
        IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<CommandResultDto> Handle(
        CancelReservationCommand request,
        CancellationToken cancellationToken)
    {
        var reservation = await _repository.GetByIdAsync(request.ReservationId);

        if (reservation == null)
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "Reservation not found."
            };
        }

        var currentUserId = _userContext.GetCurrentUserId();

        if (reservation.UserId != currentUserId)
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "You are not allowed to cancel this reservation."
            };
        }

        if (!reservation.CanBeCancelled())
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "Reservation cannot be cancelled."
            };
        }

        reservation.Cancel();

        await _repository.UpdateAsync(reservation);

        return new CommandResultDto
        {
            Success = true,
            ReservationId = reservation.Id,
            Message = "Reservation cancelled successfully."
        };
    }
}
