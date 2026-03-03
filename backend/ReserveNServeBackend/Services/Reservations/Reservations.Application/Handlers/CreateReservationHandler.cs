using MediatR;
using Reservations.Application.Commands;
using Reservations.Application.DTOs;
using Reservations.Application.Interfaces;
using Reservations.Application.Queries;
using Reservations.Domain.Entities;
using Reservations.Domain.ValueObjects;

namespace Reservations.Application.Handlers;

public class CreateReservationHandler 
    : IRequestHandler<CreateReservationCommand, CommandResultDto>
{
    private readonly IReservationRepository _repository;
    private readonly IUserContextService _userContext;
    private readonly IRestaurantService _restaurantService;
    private readonly IMediator _mediator;

    public CreateReservationHandler(
        IReservationRepository repository, 
        IUserContextService userContext,
        IRestaurantService restaurantService,
        IMediator mediator)
    {
        _repository = repository;
        _userContext = userContext;
        _restaurantService = restaurantService;
        _mediator = mediator;
    }

    public async Task<CommandResultDto> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
    {
        // current user
        var currentUserId = _userContext.GetCurrentUserId();

        // parse date and time
        DateTime startTime;
        try
        {
            var date = DateTime.Parse(request.Date); // "yyyy-MM-dd"
            var time = TimeSpan.Parse(request.StartTime); // "HH:mm"
            startTime = date.Date + time;
        }
        catch
        {
            return new CommandResultDto
            {
                Success = false,
                Message = "Invalid date or time format."
            };
        }

        // get restaurant data (menu + duration)
        var restaurantData = await _restaurantService
            .GetDataAsync(request.RestaurantId, request.Orders.Select(o => o.MenuItemId).ToList());

        if (!restaurantData.Exists)
            return new CommandResultDto 
            { 
                Success = false, 
                Message = "Restaurant does not exist." 
            };

        startTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc);
        var durationMinutes = restaurantData.DefaultReservationDuration;

        // check table availability 
        var tablesAvailability = await _mediator.Send(new GetTablesWithAvailabilityQuery
        {
            RestaurantId = request.RestaurantId,
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

        // create reservation
        var reservation = new Reservation
        {
            Id = Guid.NewGuid(),
            UserId = currentUserId,
            RestaurantId = request.RestaurantId,
            TableGroupId = request.TableGroupId,
            StartTime = startTime,
            DurationMinutes = durationMinutes,
            GuestNumber = request.GuestNumber,
            ServingTime = request.ServingTime
        };

        // add pre-orders
        foreach (var item in request.Orders)
        {
            var menuItem = restaurantData.MenuItems.FirstOrDefault(m => m.Id == item.MenuItemId);
            if (menuItem == null)
            {
                return new CommandResultDto 
                { 
                    Success = false, 
                    Message = $"Menu item {item.MenuItemId} does not exist." 
                };
            }

            var order = new Order
            {
                ReservationId = reservation.Id,
                MenuItemId = item.MenuItemId,
                FoodName = menuItem.Name,
                Price = menuItem.Price,
                Quantity = item.Quantity
            };
            
            reservation.AddOrder(order);
        }

        // handle no orders → status confirmed & total 0
        if (!reservation.Orders.Any())
            reservation.ReplaceOrders(new List<Order>());

        // save
        await _repository.AddAsync(reservation);

        // return result
        return new CommandResultDto
        {
            Success = true,
            ReservationId = reservation.Id,
            Message = $"Reservation created successfully ({reservation.Status})."
        };
    }
}