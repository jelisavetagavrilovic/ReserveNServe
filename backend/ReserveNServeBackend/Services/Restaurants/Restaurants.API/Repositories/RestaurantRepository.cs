using Microsoft.EntityFrameworkCore;
using Restaurants.API.Data;
using Restaurants.API.DTOs;
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

        public async Task<byte[]> GetImageAsync(int id)
        {
            return await _restaurantsContext.Restaurants.Where(r => r.id == id).Select(r => r.image).FirstOrDefaultAsync();
        }

        public async Task<Table> GetTableAsync(int id)
        {
            return await _restaurantsContext.Tables.Where(t => t.id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<MenuItem>> GetMenuItemsAsync(IEnumerable<int> ids)
        {
            return await _restaurantsContext.MenuItems.Where(e => ids.Contains(e.id)).ToListAsync();
        }

        public async Task<IEnumerable<Restaurant>> GetRestaurantsAsync()
        {
            return await _restaurantsContext.Restaurants.ToListAsync();
        }

        public async Task<IEnumerable<Table>> GetTablesForRestaurantAsync(int restaurantId)
        {
            return await _restaurantsContext.Tables.Where(t => t.restaurant_id == restaurantId).ToListAsync();
        }

        public async Task<ReservationDurationDTO> GetReservationDurationAsync(int id)
        {
            var restaurant = _restaurantsContext.Restaurants.Where(e => e.id == id);
            if(restaurant == null || restaurant.Count() == 0)
            {
                return new ReservationDurationDTO
                {
                    Exists = false,
                    DefaultReservationDuration = 0
                };
            }
            return new ReservationDurationDTO
            {
                Exists = true,
                DefaultReservationDuration = restaurant.Select(r => r.reservation_duration).FirstOrDefault()
            };
        }
    }
}
