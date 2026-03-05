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

        internal async Task<byte[]> GetImageAsync(int id)
        {
            return await _restaurantsRepository.GetImageAsync(id);
        }

        internal async Task<IEnumerable<MenuItemDTO>> GetMenuItemsAsync(int restaurantId, IEnumerable<int> ids)
        {
            IEnumerable<MenuItem> menuItems =  await _restaurantsRepository.GetMenuItemsAsync(restaurantId, ids);
            IEnumerable<MenuItemDTO> menuItemDTOs = [];

            foreach(MenuItem menuItem in menuItems)
            {
                MenuItemDTO menuItemDTO = new MenuItemDTO
                {
                    Id = menuItem.id,
                    Price = menuItem.price,
                    Name = menuItem.food_name
                };
                menuItemDTOs = menuItemDTOs.Append(menuItemDTO);
            }
            return menuItemDTOs;
        }
    }
}
