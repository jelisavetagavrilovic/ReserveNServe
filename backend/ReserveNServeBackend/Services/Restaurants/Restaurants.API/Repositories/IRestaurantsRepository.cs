using Restaurants.API.DTOs;
using Restaurants.API.DTOs.Requests;
using Restaurants.API.Entities;

namespace Restaurants.API.Repositories
{
    public interface IRestaurantsRepository
    {
        public Task<IEnumerable<Restaurant>> GetRestaurantsAsync(GetRestaurantsRequest request);
        public Task<Restaurant?> GetRestaurantByIdAsync(int id);
        public Task<IEnumerable<Table>> GetTablesForRestaurantAsync(int restaurantId);
        public Task<Table?> GetTableAsync(int id);
        public Task<IEnumerable<MenuItem>> GetMenuItemsAsync(int restaurantId);
        public Task<string> GetCuisineTypeNameAsync(int cuisineTypeId);
        public Task<IEnumerable<string>> GetCuisinesAsync();
        public Task<IEnumerable<string>> GetRangePricesAsync();
    }
}
