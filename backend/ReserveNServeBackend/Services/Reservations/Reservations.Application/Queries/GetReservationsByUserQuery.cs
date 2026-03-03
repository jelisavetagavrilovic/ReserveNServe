using MediatR;
using Reservations.Application.DTOs;

namespace Reservations.Application.Queries;

public class GetReservationsByUserQuery  : IRequest<List<ReservationResultDto>>
{
    
}