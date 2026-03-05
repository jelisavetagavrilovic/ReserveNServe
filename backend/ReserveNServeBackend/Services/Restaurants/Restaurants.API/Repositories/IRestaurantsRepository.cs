using Restaurants.API.Entities;

namespace Restaurants.API.Repositories
{
    public interface IRestaurantsRepository
    {
        public Task<byte[]> GetImageAsync(int id);
        public Task<IEnumerable<MenuItem>> GetMenuItemsAsync(int restaurantId, IEnumerable<int> ids);
        public Task<IEnumerable<Restaurant>> GetRestaurantsAsync();
        public Task<IEnumerable<Table>> GetTablesForRestaurantAsync(int restaurantId);
    }
}
