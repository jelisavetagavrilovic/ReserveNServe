using Restaurants.API.Entities;

namespace Restaurants.API.Repositories
{
    public interface IRestaurantsRepository
    {
        public Task<IEnumerable<Restaurant>> GetRestaurantsAsync();
        public Task<IEnumerable<Table>> GetTablesForRestaurantAsync(int restaurantId);
    }
}
