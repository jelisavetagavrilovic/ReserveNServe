using MediatR;
using Reservations.Application.DTOs;
using Reservations.Application.Interfaces;
using Reservations.Application.Queries;

namespace Reservations.Application.Handlers;

public class GetReservationByIdHandler : IRequestHandler<GetReservationByIdQuery, ReservationResultDto>
{
    private readonly IReservationRepository _repository;
    private readonly IUserContextService _userContext;

    public GetReservationByIdHandler(
        IReservationRepository repo,
        IUserContextService userContext)
    {
        _repository = repo;
        _userContext = userContext;
    }

    public async Task<ReservationResultDto> Handle(GetReservationByIdQuery request, CancellationToken cancellationToken)
    {
        var reservation = await _repository.GetByIdAsync(request.ReservationId);
        if (reservation == null) 
            return null;
        
        var currentUserId = _userContext.GetCurrentUserId();
        if (reservation.UserId != currentUserId)
            throw new UnauthorizedAccessException("You are not allowed to access this reservation.");


        return new ReservationResultDto()
        {
            Id = reservation.Id,
            RestaurantId = reservation.RestaurantId,
            TableGroupId = reservation.TableGroupId,
            Date = reservation.StartTime.ToString("yyyy-MM-dd"),
            Time = reservation.StartTime.ToString("HH:mm"),
            GuestNumber = reservation.GuestNumber,
            Orders = reservation.Orders.Select(o => new OrderResultDto()
            {
                MenuItemId = o.MenuItemId,
                FoodName = o.FoodName,
                Quantity = o.Quantity,
                Price = o.Price,
            }).ToList(),
            ServingTime = reservation.ServingTime.HasValue
                ? reservation.ServingTime.Value.ToString("HH:mm")
                : null,
            TotalAmount = reservation.TotalAmount,
            Status = reservation.Status
        };
    }
}