using MediatR;
using Reservations.Application.DTOs;
using Reservations.Application.Interfaces;
using Reservations.Application.Queries;
using Reservations.Domain.ValueObjects;

namespace Reservations.Application.Handlers;

public class GetTablesWithAvailabilityHandler : IRequestHandler<GetTablesWithAvailabilityQuery, List<TableDataDto>>
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IRestaurantService _restaurantService;

    public GetTablesWithAvailabilityHandler(
        IReservationRepository reservationRepository,
        IRestaurantService restaurantService)
    {
        _reservationRepository = reservationRepository;
        _restaurantService = restaurantService;
    }

    public async Task<List<TableDataDto>> Handle(
        GetTablesWithAvailabilityQuery request, 
        CancellationToken cancellationToken)
    {
        // parse date and time
        if (!DateTime.TryParse(request.Date, out var date))
            throw new ArgumentException("Invalid date format.");
        if (!TimeSpan.TryParse(request.Time, out var time))
            throw new ArgumentException("Invalid time format.");
        
        var requestedStart = date.Date + time;
        
        // restaurant data
        var restaurantData = await _restaurantService
            .GetDataAsync(request.RestaurantId, new List<int>());

        if (!restaurantData.Exists)
            throw new ArgumentException("Restaurant does not exist.");

        var tables = await _restaurantService.GetTablesAsync(request.RestaurantId);
        var defaultDurationMinutes = restaurantData.DefaultReservationDuration;
        var requestedEnd = requestedStart.AddMinutes(defaultDurationMinutes);

        // reservations
        var reservations = await _reservationRepository.GetByRestaurantIdAsync(request.RestaurantId);

        // calculate availability 
        var reservedCountByGroup = reservations
            .Where(r =>
                r.Status != ReservationStatus.Cancelled &&
                r.StartTime < requestedEnd &&
                requestedStart < r.EndTime)
            .GroupBy(r => r.TableGroupId)
            .ToDictionary(g => g.Key, g => g.Count());

        
        var tableAvailability = tables.Select(t =>
        {
            reservedCountByGroup.TryGetValue(t.GroupId, out var reservedCount);
            var available = t.AvailableNumber - (reservedCount > 0 ? reservedCount : 0);
            return new TableDataDto()
            {
                GroupId = t.GroupId,
                Location = t.Location,
                Seats = t.Seats,
                AvailableNumber = available
            };
        }).ToList();

        return tableAvailability;
    }

}