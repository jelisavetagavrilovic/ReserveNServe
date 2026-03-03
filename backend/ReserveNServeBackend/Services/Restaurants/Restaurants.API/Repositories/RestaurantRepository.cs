using Microsoft.EntityFrameworkCore;
using Restaurants.API.Data;
using Restaurants.API.Entities;

namespace Restaurants.API.Repositories
{
    public class RestaurantRepository : IRestaurantsRepository
    {
        private RestaurantsContext _restaurantsContext;
        public RestaurantRepository(RestaurantsContext dbContext)
        {
            _restaurantsContext = dbContext;
        }


        public async Task<IEnumerable<Restaurant>> GetRestaurantsAsync()
        {
            return await _restaurantsContext.Restaurants.ToListAsync();
        }

        public async Task<IEnumerable<Table>> GetTablesForRestaurantAsync(int restaurantId)
        {
            return await _restaurantsContext.Tables.Where(t => t.restaurant_id == restaurantId).ToListAsync();
        }
    }
}
