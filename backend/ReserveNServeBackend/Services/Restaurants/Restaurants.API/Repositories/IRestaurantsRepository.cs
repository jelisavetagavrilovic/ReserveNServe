using Restaurants.API.DTOs;
using Restaurants.API.Entities;

namespace Restaurants.API.Repositories
{
    public interface IRestaurantsRepository
    {
        public Task<byte[]> GetImageAsync(int id);
        public Task<Table> GetTableAsync(int id);
        public Task<IEnumerable<MenuItem>> GetMenuItemsAsync(IEnumerable<int> ids);
        public Task<IEnumerable<Restaurant>> GetRestaurantsAsync();
        public Task<IEnumerable<Table>> GetTablesForRestaurantAsync(int restaurantId);
        Task<ReservationDurationDTO> GetReservationDurationAsync(int id);
    }
}
