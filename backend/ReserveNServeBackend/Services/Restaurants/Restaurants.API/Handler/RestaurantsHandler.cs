using Restaurants.API.DTOs;
using Restaurants.API.Entities;
using Restaurants.API.Repositories;

namespace Restaurants.API.Handler
{
    public class RestaurantsHandler(IRestaurantsRepository restaurantsRepository)
    {
        private IRestaurantsRepository _restaurantsRepository = restaurantsRepository;

        public async Task<IEnumerable<Restaurant>> GetRestaurantsAsync()
        {
            return await _restaurantsRepository.GetRestaurantsAsync();
        }

        public async Task<IEnumerable<TableDTO>> GetTablesForRestaurantAsync(int restaurantId)
        {
            IEnumerable<Table> tables = _restaurantsRepository.GetTablesForRestaurantAsync(restaurantId).Result;
            if(tables == null)
            {
                return [];
            }

            IEnumerable<TableDTO> tableDTOs = [];
            foreach(Table table in tables)
            {
                TableDTO tableDTO = new TableDTO
                {
                    GroupId = table.id,
                    Location = table.location,
                    Seats = table.seats,
                    AvailableNumber = table.total_table_number
                };
                tableDTOs = tableDTOs.Append(tableDTO);
            }

            return tableDTOs;
        }
    }
}
