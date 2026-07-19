using Reservations.Application.Common.Pagination;
using Reservations.Application.DTOs.External.Restaurant;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.DTOs.Responses;
using Reservations.Application.Interfaces;
using Reservations.Domain.Entities;

namespace Reservations.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IRestaurantClient _restaurantClient;
    private readonly IPaymentClient _paymentClient;
    private readonly INotificationClient _notificationClient;

    public ReservationService(
        IReservationRepository reservationRepository,
        IRestaurantClient restaurantClient,
        IPaymentClient paymentClient,
        INotificationClient notificationClient)
    {
        _reservationRepository = reservationRepository;
        _restaurantClient = restaurantClient;
        _paymentClient = paymentClient;
        _notificationClient = notificationClient;
    }
    
    private async Task<Reservation> GetReservationAsync(
        Guid reservationId,
        Guid userId)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId);

        if (reservation == null)
            throw new KeyNotFoundException("Reservation not found.");

        if (reservation.UserId != userId)
            throw new UnauthorizedAccessException(
                "You are not allowed to access this reservation.");

        return reservation;
    }
    
    private async Task ValidateAvailabilityAsync(
        TableGroupResponse tableGroup,
        DateTime startTime,
        DateTime endTime,
        Guid? reservationIdToIgnore = null)
    {
        var reservedTables =
            await _reservationRepository.CountActiveReservationsAsync(
                tableGroup.Id,
                startTime,
                endTime,
                reservationIdToIgnore);

        if (reservedTables >= tableGroup.TableCount)
        {
            throw new InvalidOperationException(
                "No available tables for the selected time.");
        }
    }
    
    private static TableGroupResponse GetTableGroup(
        RestaurantInfoResponse restaurant,
        int tableGroupId)
    {
        var tableGroup = restaurant.TableGroups.FirstOrDefault(
            t => t.Id == tableGroupId);

        if (tableGroup == null)
        {
            throw new InvalidOperationException(
                "Table group was not found.");
        }

        return tableGroup;
    }
    
    private async Task<List<Order>> BuildOrdersAsync(
        IEnumerable<OrderRequest> requests)
    {
        var requestList = requests.ToList();

        var menuItems = await _restaurantClient.GetMenuItemsAsync(
            requestList.Select(r => r.MenuItemId));

        var menuItemsById = menuItems.ToDictionary(m => m.MenuItemId);

        var orders = new List<Order>();

        foreach (var request in requestList)
        {
            if (!menuItemsById.TryGetValue(request.MenuItemId, out var menuItem))
                throw new InvalidOperationException(
                    $"Menu item {request.MenuItemId} was not found.");

            orders.Add(new Order
            {
                MenuItemId = menuItem.MenuItemId,
                FoodName = menuItem.FoodName,
                Price = menuItem.Price,
                Quantity = request.Quantity
            });
        }

        return orders;
    }
    
    private async Task<RestaurantInfoResponse> GetRestaurantInfoAsync(
        int restaurantId)
    {
        var restaurant = await _restaurantClient.GetRestaurantInfoAsync(
            restaurantId);

        if (restaurant == null)
            throw new InvalidOperationException(
                "Restaurant was not found.");

        return restaurant;
    }
    
    public async Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int restaurantId,
        DateOnly date)
    {
        var restaurant = await GetRestaurantInfoAsync(
            restaurantId);

        var slots = new List<AvailableSlotResponse>();

        var current = date.ToDateTime(restaurant.OpeningTime);
        var closing = date.ToDateTime(restaurant.ClosingTime);

        while (current < closing)
        {
            var end = current.AddMinutes(
                restaurant.ReservationDurationMinutes);

            ValidateWorkingHours(
                restaurant,
                current,
                ref end);

            var hasAvailableTable = false;

            foreach (var tableGroup in restaurant.TableGroups)
            {
                var reservedTables =
                    await _reservationRepository.CountActiveReservationsAsync(
                        tableGroup.Id,
                        current,
                        end);

                if (reservedTables < tableGroup.TableCount)
                {
                    hasAvailableTable = true;
                    break;
                }
            }

            if (hasAvailableTable)
            {
                slots.Add(new AvailableSlotResponse
                {
                    Time = TimeOnly.FromDateTime(current)
                });
            }

            current = current.AddMinutes(30);
        }

        return slots;
    }
    
    public async Task<List<AvailableTableResponse>> GetAvailableTablesAsync(
        int restaurantId,
        DateOnly date,
        TimeOnly time)
    {
        var restaurant = await GetRestaurantInfoAsync(
            restaurantId);

        var startTime = date.ToDateTime(time);

        var endTime = startTime.AddMinutes(
            restaurant.ReservationDurationMinutes);

        var closing = date.ToDateTime(
            restaurant.ClosingTime);

        if (endTime > closing)
        {
            endTime = closing;
        }

        var availableTables = new List<AvailableTableResponse>();

        foreach (var tableGroup in restaurant.TableGroups)
        {
            var reservedTables =
                await _reservationRepository.CountActiveReservationsAsync(
                    tableGroup.Id,
                    startTime,
                    endTime);

            var available =
                tableGroup.TableCount - reservedTables;

            availableTables.Add(new AvailableTableResponse
            {
                TableGroupId = tableGroup.Id,
                Location = tableGroup.Location,
                Capacity = tableGroup.Capacity,
                AvailableTables = Math.Max(0, available)
            });
        }

        return availableTables;
    }
    
    private ReservationResponse MapToResponse(
        Reservation reservation,
        RestaurantInfoResponse restaurant, 
        TableGroupResponse tableGroup)
    {
        return new ReservationResponse
        {
            Id = reservation.Id,
            RestaurantId = reservation.RestaurantId,
            RestaurantName = restaurant.RestaurantName,
            RestaurantAddress = restaurant.RestaurantAddress,
            RestaurantCity = restaurant.RestaurantCity,

            TableGroupId = reservation.TableGroupId,
            TableLocation = tableGroup.Location,
            TableSeats = tableGroup.Capacity,

            Date = DateOnly.FromDateTime(reservation.StartTime),
            StartTime = TimeOnly.FromDateTime(reservation.StartTime),

            GuestNumber = reservation.GuestNumber,

            ServingTime = reservation.ServingTime?.ToString(@"hh\:mm"),

            TotalAmount = reservation.TotalAmount,

            Status = reservation.Status,

            Orders = reservation.Orders.Select(o => new OrderResponse
            {
                MenuItemId = o.MenuItemId,
                FoodName = o.FoodName,
                Price = o.Price,
                Quantity = o.Quantity,
                Total = o.Price * o.Quantity
            }).ToList()
        };
    }
    
    private static void ValidateWorkingHours(
        RestaurantInfoResponse restaurant,
        DateTime startTime,
        ref DateTime endTime)
    {
        var openingDateTime = startTime.Date.Add(
            restaurant.OpeningTime.ToTimeSpan());

        var closingDateTime = startTime.Date.Add(
            restaurant.ClosingTime.ToTimeSpan());

        if (startTime < openingDateTime)
            throw new InvalidOperationException(
                "The restaurant is not open at the selected time.");

        if (startTime >= closingDateTime)
            throw new InvalidOperationException(
                "The restaurant is already closed at the selected time.");

        if (endTime > closingDateTime)
        {
            endTime = closingDateTime;
        }
    }

    public async Task<ReservationResponse> CreateReservationAsync(
        Guid userId,
        CreateReservationRequest request)
    {
        var restaurant = await GetRestaurantInfoAsync(
            request.RestaurantId);

        var tableGroup = GetTableGroup(
            restaurant,
            request.TableGroupId);
        
        var startTime = DateTime.SpecifyKind(
            request.Date.ToDateTime(request.StartTime),
            DateTimeKind.Utc);

        var endTime = startTime.AddMinutes(
            restaurant.ReservationDurationMinutes);
        
        ValidateWorkingHours(
            restaurant,
            startTime,
            ref endTime);
        
        await ValidateAvailabilityAsync(
            tableGroup,
            startTime,
            endTime);
        
        var reservation = new Reservation(
            userId,
            request.RestaurantId,
            request.TableGroupId,
            startTime,
            endTime,
            request.GuestNumber,
            request.ServingTime?.ToTimeSpan());
        
        var orders = await BuildOrdersAsync(request.Orders);
        
        reservation.AddOrders(orders);
        
        await _reservationRepository.AddAsync(reservation);

        return MapToResponse(
            reservation,
            restaurant, 
            tableGroup);
    }

    public async Task<ReservationResponse> GetReservationByIdAsync(
        Guid reservationId,
        Guid userId)
    {
        var reservation = await GetReservationAsync(
            reservationId,
            userId);

        var restaurant = await GetRestaurantInfoAsync(
            reservation.RestaurantId);
        
        var tableGroup = GetTableGroup(
            restaurant,
            reservation.TableGroupId);

        return MapToResponse(
            reservation,
            restaurant, 
            tableGroup);
    }

    public async Task<PaginatedResult<ReservationResponse>> GetUserReservationsAsync(
        Guid userId,
        ReservationQueryRequest request)
    {
        var result = await _reservationRepository
            .GetForUserAsync(userId, request);


        var responses = new List<ReservationResponse>();

        foreach(var reservation in result.Items)
        {
            var restaurant = await GetRestaurantInfoAsync(
                reservation.RestaurantId);
            
            var tableGroup = GetTableGroup(
                restaurant,
                reservation.TableGroupId);

            responses.Add(
                MapToResponse(
                    reservation,
                    restaurant,
                    tableGroup));
        }

        return new PaginatedResult<ReservationResponse>
        {
            Items = responses,
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        };
    }

    public async Task<ReservationResponse> UpdateReservationAsync(
        Guid reservationId,
        Guid userId,
        UpdateReservationRequest request)
    {
        var reservation = await GetReservationAsync(
            reservationId,
            userId);
        
        var restaurant = await GetRestaurantInfoAsync(
            reservation.RestaurantId);

        var tableGroup = GetTableGroup(
            restaurant,
            request.TableGroupId);

        var startTime = DateTime.SpecifyKind(
            request.Date.ToDateTime(request.StartTime),
            DateTimeKind.Utc);
        
        var endTime = startTime.AddMinutes(
            restaurant.ReservationDurationMinutes);

        ValidateWorkingHours(
            restaurant,
            startTime,
            ref endTime);
        
        await ValidateAvailabilityAsync(
            tableGroup,
            startTime,
            endTime,
            reservation.Id);
        
        reservation.UpdateDetails(
            request.TableGroupId,
            startTime,
            endTime,
            request.GuestNumber,
            request.ServingTime?.ToTimeSpan());
        
        await _reservationRepository.UpdateAsync(
            reservation);
        
        return MapToResponse(
            reservation,
            restaurant,
            tableGroup);
    }

    public async Task<ReservationResponse> ReplaceOrdersAsync(
        Guid reservationId,
        Guid userId,
        UpdateReservationOrdersRequest request)
    {
        var reservation = await GetReservationAsync(
            reservationId,
            userId);
        
        var orders = await BuildOrdersAsync(
            request.Orders);
        
        reservation.ReplaceOrders(orders);

        await _reservationRepository.UpdateAsync(
            reservation);

        var restaurant = await GetRestaurantInfoAsync(
            reservation.RestaurantId);
        
        var tableGroup = GetTableGroup(
            restaurant,
            reservation.TableGroupId);
        
        return MapToResponse(
            reservation,
            restaurant, 
            tableGroup);
    }

    public async Task CancelReservationAsync(
        Guid reservationId,
        Guid userId)
    {
        var reservation = await GetReservationAsync(
            reservationId,
            userId);
        
        reservation.Cancel();
        
        await _reservationRepository.UpdateAsync(
            reservation);
        
        await _notificationClient
            .SendReservationCancelledAsync(
                reservation.Id);
    }

    public async Task ConfirmPaymentAsync(
        Guid reservationId)
    {
        var reservation =
            await _reservationRepository.GetByIdAsync(
                reservationId);


        if(reservation == null)
            throw new KeyNotFoundException();
        
        reservation.Confirm();
        
        await _reservationRepository.UpdateAsync(
            reservation);
        
        await _notificationClient
            .SendReservationConfirmedAsync(
                reservation.Id);
    }

    public async Task MarkPaymentFailedAsync(
        Guid reservationId)
    {
        var reservation =
            await _reservationRepository.GetByIdAsync(
                reservationId);
        
        if(reservation == null)
            throw new KeyNotFoundException();
        
        reservation.MarkPaymentFailed();
        
        await _reservationRepository.UpdateAsync(
            reservation);
    }
}