using MediatR;
using Reservations.Application.DTOs;

namespace Reservations.Application.Queries;

public class GetReservationByIdQuery : IRequest<ReservationResultDto>
{
    public Guid ReservationId { get; init; }
}