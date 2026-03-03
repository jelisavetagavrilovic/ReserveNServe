using MediatR;
using Reservations.Application.DTOs;
using Reservations.Application.Interfaces;
using Reservations.Application.Queries;

namespace Reservations.Application.Handlers;

public class GetReservationsByUserHandler
    : IRequestHandler<GetReservationsByUserQuery, List<ReservationResultDto>>
{
    private readonly IReservationRepository _repository;
    private readonly IUserContextService _userContext;

    public GetReservationsByUserHandler(
        IReservationRepository repository,
        IUserContextService userContext)
    {
        _repository = repository;
        _userContext = userContext;
    }

    public async Task<List<ReservationResultDto>> Handle(
        GetReservationsByUserQuery request,
        CancellationToken cancellationToken)
    {
        var currentUserId = _userContext.GetCurrentUserId();

        var reservations = await _repository.GetByUserIdAsync(currentUserId);

        return reservations
            .OrderByDescending(r => r.StartTime)
            .Select(reservation => new ReservationResultDto
            {
                Id = reservation.Id,
                RestaurantId = reservation.RestaurantId,
                TableGroupId = reservation.TableGroupId,
                Date = reservation.StartTime.ToString("yyyy-MM-dd"),
                Time = reservation.StartTime.ToString("HH:mm"),
                GuestNumber = reservation.GuestNumber,

                Orders = reservation.Orders.Select(o => new OrderResultDto
                {
                    MenuItemId = o.MenuItemId,
                    FoodName = o.FoodName,
                    Quantity = o.Quantity,
                    Price = o.Price
                }).ToList(),

                ServingTime = reservation.ServingTime.HasValue
                    ? reservation.ServingTime.Value.ToString(@"hh\:mm")
                    : null,

                TotalAmount = reservation.TotalAmount,
                Status = reservation.Status
            })
            .ToList();
    }
}