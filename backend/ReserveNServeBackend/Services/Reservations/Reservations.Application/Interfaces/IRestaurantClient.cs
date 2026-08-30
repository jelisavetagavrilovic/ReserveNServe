using Reservations.Application.DTOs.External.Restaurant;

namespace Reservations.Application.Interfaces;

public interface IRestaurantClient
{
    Task<RestaurantInfoResponse?> GetRestaurantInfoAsync(
        int restaurantId);

    Task<IReadOnlyList<MenuItemResponse>>
        GetMenuItemsAsync(
            int restaurantId,
            IEnumerable<int> menuItemIds);
    
}