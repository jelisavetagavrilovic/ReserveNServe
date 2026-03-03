using Reservations.Application.DTOs;

namespace Reservations.Application.Interfaces;

public interface IRestaurantService
{
    Task<RestaurantDataDto> GetDataAsync(int restaurantId, List<int>? menuItemIds = null);
    Task<List<TableDataDto>> GetTablesAsync(int restaurantId);
}