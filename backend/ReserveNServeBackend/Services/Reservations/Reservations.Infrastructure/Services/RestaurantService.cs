using Reservations.Application.DTOs;
using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Services;

public class RestaurantService : IRestaurantService
{
    public Task<RestaurantDataDto> GetDataAsync(int restaurantId, List<int>? menuItemIds = null)
    {
        var allMenuItems = new List<RestaurantDataDto.MenuItemDto>
        {
            new() { Id = 1, Name = "Pizza", Price = 12.5m },
            new() { Id = 2, Name = "Pasta", Price = 10m },
            new() { Id = 3, Name = "Salad", Price = 5.5m }
        };

        var selectedItems = menuItemIds == null 
            ? allMenuItems
            : allMenuItems.Where(m => menuItemIds.Contains(m.Id)).ToList();

        return Task.FromResult(new RestaurantDataDto()
        {
            Exists = true,                    
            DefaultReservationDuration = 180, 
            MenuItems = selectedItems,
        });
    }
    
    public Task<List<TableDataDto>> GetTablesAsync(int restaurantId)
    {
        var tables = new List<TableDataDto>
        {
            new () { GroupId = 1, Location = "A1", Seats = 4, AvailableNumber = 2 },
            new () { GroupId = 2, Location = "A2", Seats = 4, AvailableNumber = 2 },
            new () { GroupId = 3, Location = "B1", Seats = 2, AvailableNumber = 1 },
            new () { GroupId = 4, Location = "B2", Seats = 2, AvailableNumber = 1 }
        };

        return Task.FromResult(tables);
    }
    
    /*
    [HttpGet("metadata/{restaurantId}")]
    public async Task<ActionResult<RestaurantMetadataDto>> GetMetadata(int restaurantId, [FromQuery] List<int>? menuItemIds)
    {
        var restaurant = await _repository.GetByIdAsync(restaurantId);
        if (restaurant == null) return NotFound();

        var menuItems = await _menuRepository.GetByIdsAsync(menuItemIds ?? new List<int>());

        return new RestaurantMetadataDto
        {
            Exists = true,
            DefaultReservationDuration = restaurant.DefaultReservationDuration,
            MenuItems = menuItems.Select(m => new RestaurantMetadataDto.MenuItemDto
            {
                Id = m.Id,
                Name = m.Name,
                Price = m.Price
            }).ToList()
        };
    }
    */
}