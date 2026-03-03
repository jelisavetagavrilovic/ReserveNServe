using MediatR;
using Reservations.Application.Commands;
using Reservations.Application.DTOs;
using Reservations.Application.Interfaces;
using Reservations.Application.Queries;
using Reservations.Domain.Entities;
using Reservations.Domain.ValueObjects;

namespace Reservations.Application.Handlers;

public class UpdateReservationHandler
    : IRequestHandler<UpdateReservationCommand, CommandResultDto>
{
    private readonly IReservationRepository _repository;
    private readonly IUserContextService _userContextService;
    private readonly IRestaurantService _restaurantService;
    private readonly IMediator _mediator;

    public UpdateReservationHandler(
        IReservationRepository repository,
        IUserContextService userContextService,
        IRestaurantService restaurantService,
        IMediator mediator)
    {
        _repository = repository;
        _userContextService = userContextService;
        _restaurantService = restaurantService;
        _mediator = mediator;
    }

    public async Task<CommandResultDto> Handle(
        UpdateReservationCommand request,
        CancellationToken cancellationToken)
    {
        var reservation = await _repository.GetByIdAsync(request.Id);
        if (reservation == null)
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "Reservation not found."
            };
        }

        // check user
        var currentUserId = _userContextService.GetCurrentUserId();
        if (reservation.UserId != currentUserId)
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "You are not allowed to modify this reservation."
            };
        }

        // chek can be modified reservation 
        if (!reservation.CanBeModified())
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "Reservation cannot be modified."
            };
        }

        // parse date and time
        DateTime newStartTime;
        try
        {
            var date = DateTime.Parse(request.Date);
            var time = TimeSpan.Parse(request.StartTime);
            newStartTime = date.Date + time;
        }
        catch
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "Invalid date or time format."
            };
        }

        newStartTime = DateTime.SpecifyKind(newStartTime, DateTimeKind.Utc);
        var newEndTime = newStartTime.AddMinutes(reservation.DurationMinutes);

        // check conflict termine 
        // var existingReservations = await _repository
        //     .GetByRestaurantIdAsync(reservation.RestaurantId);
        //
        // bool isConflict = existingReservations.Any(r =>
        //     r.Id != reservation.Id &&
        //     r.TableGroupId == request.TableGroupId &&
        //     r.Status != ReservationStatus.Cancelled &&
        //     r.StartTime < newEndTime &&
        //     newStartTime < r.EndTime
        // );
        //
        // if (isConflict)
        // {
        //     return new CommandResultDto
        //     {
        //         Success = false,
        //         Message = "This table is already reserved at the requested time."
        //     };
        // }
        
        // 4check table availability via query
        var tablesAvailability = await _mediator.Send(new GetTablesWithAvailabilityQuery
        {
            RestaurantId = reservation.RestaurantId,
            Date = request.Date,
            Time = request.StartTime,
            GuestNumber = request.GuestNumber
        });

        var table = tablesAvailability.FirstOrDefault(t => t.GroupId == request.TableGroupId);
        if (table == null || table.AvailableNumber <= 0)
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "This table is already reserved at the requested time."
            };
        }

        // update basic data
        try
        {
            reservation.UpdateDetails(
                request.TableGroupId,
                newStartTime,
                request.GuestNumber,
                request.ServingTime
            );
        }
        catch (Exception ex)
        {
            return new CommandResultDto
            {
                Success = false,
                Message = ex.Message
            };
        }

        // update orders
        if (request.Orders.Any())
        {
            var restaurantData = await _restaurantService
                .GetDataAsync(
                    reservation.RestaurantId,
                    request.Orders.Select(o => o.MenuItemId).ToList());

            var newOrders = new List<Order>();

            foreach (var item in request.Orders)
            {
                var menuItem = restaurantData.MenuItems
                    .FirstOrDefault(m => m.Id == item.MenuItemId);

                if (menuItem == null)
                {
                    return new CommandResultDto
                    {
                        Success = false,
                        Message = $"Menu item {item.MenuItemId} does not exist."
                    };
                }

                newOrders.Add(new Order
                {
                    ReservationId = reservation.Id,
                    MenuItemId = menuItem.Id,
                    FoodName = menuItem.Name,
                    Price = menuItem.Price,
                    Quantity = item.Quantity
                });
            }
            
            reservation.ReplaceOrders(newOrders);
        }
        else
        {
            // don't have orders
            reservation.ReplaceOrders(new List<Order>());
        }

        await _repository.UpdateAsync(reservation);

        return new CommandResultDto
        {
            Success = true,
            ReservationId = reservation.Id,
            Message = "Reservation updated successfully."
        };
    }
}