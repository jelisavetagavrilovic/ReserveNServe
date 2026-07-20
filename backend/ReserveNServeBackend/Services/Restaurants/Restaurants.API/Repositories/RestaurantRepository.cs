using Microsoft.EntityFrameworkCore;
using Restaurants.API.Data;
using Restaurants.API.DTOs;
using Restaurants.API.DTOs.Requests;
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

        public async Task<IEnumerable<Restaurant>> GetRestaurantsAsync(GetRestaurantsRequest request)
        {
            IQueryable<Restaurant> query = _restaurantsContext.Restaurants.AsQueryable();
            if (!string.IsNullOrEmpty(request.search))
            {
                query = query.Where(e => EF.Functions.Like(e.name, $"%{request.search}%") ||
                                         EF.Functions.Like(e.city, $"%{request.search}%") ||
                                         EF.Functions.Like(e.address, $"%{request.search}%"));
            }
            if (!string.IsNullOrEmpty(request.cuisine_type))
            {
                var cuisine_type = await GetCuisineTypeIdAsync(request.cuisine_type);
                query = query.Where(e => e.cuisine_type == cuisine_type);
            }
            if (!string.IsNullOrEmpty(request.price))
            {
                query = query.Where(e => EF.Functions.Like(e.price, $"{request.price}"));
            }
            if (!string.IsNullOrEmpty(request.sort_by))
            {
                switch (request.sort_by)
                {
                    case "name":
                        query = query.OrderBy(e => e.name);
                        break;
                    case "rating":
                        query = query.OrderByDescending(e => e.rating);
                        break;
                    case "price":
                        query = query.OrderByDescending(e => e.price);
                        break;
                    default:
                        break;
                }
            }
            else
            {
                query = query.OrderBy(e => e.name);
            }

            return await query.Skip((request.page - 1) * request.page_size).Take(request.page_size).ToListAsync();
        }

        public async Task<Restaurant?> GetRestaurantByIdAsync(int id)
        {
            return await _restaurantsContext.Restaurants.Where(e => e.id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Table>> GetTablesForRestaurantAsync(int restaurantId)
        {
            return await _restaurantsContext.Tables.Where(t => t.restaurant_id == restaurantId).OrderBy(e => e.location).ToListAsync();
        }

        public async Task<Table> GetTableAsync(int id)
        {
            return await _restaurantsContext.Tables.Where(t => t.id == id).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<MenuItem>> GetMenuItemsAsync(int restaurantId)
        {
            return await _restaurantsContext.MenuItems.Where(e => e.restaurant_id == restaurantId).ToListAsync();
        }

        public async Task<string> GetCuisineTypeNameAsync(int cuisineTypeId)
        {
            var cuisineType = await _restaurantsContext.Cuisines.Where(e => e.id == cuisineTypeId).FirstOrDefaultAsync();
            return cuisineType.cuisine_type;
        }

        public async Task<IEnumerable<string>> GetCuisinesAsync()
        {
            return await _restaurantsContext.Cuisines.Select(e => e.cuisine_type).ToListAsync();
        }

        public async Task<IEnumerable<string>> GetRangePricesAsync()
        {
            return await _restaurantsContext.Restaurants.Select(e => e.price).Distinct().ToListAsync();
        }

        private async Task<int> GetCuisineTypeIdAsync(string cuisineTypeName)
        {
            var cuisineType = await _restaurantsContext.Cuisines.Where(e => e.cuisine_type == cuisineTypeName).FirstOrDefaultAsync();
            return cuisineType.id;
            
        }
    }
}
