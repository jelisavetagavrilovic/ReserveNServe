using Azure.Core;
using Restaurants.API.DTOs;
using Restaurants.API.DTOs.Requests;
using Restaurants.API.DTOs.Responses;
using Restaurants.API.Entities;
using Restaurants.API.Repositories;
using System.Threading.Tasks;

namespace Restaurants.API.Handler
{
    public class RestaurantsHandler(IRestaurantsRepository restaurantsRepository)
    {
        private IRestaurantsRepository _restaurantsRepository = restaurantsRepository;

        internal async Task<GetRestaurantsResponse>
            GetRestaurantsAsync(GetRestaurantsRequest request)
        {
            IEnumerable<RestaurantDTO> restaurantDTOs = [];

            try
            {
                var result =
                    await _restaurantsRepository.GetRestaurantsAsync(request);

                foreach (var restaurant in result.Items)
                {
                    try
                    {
                        var cuisineType =
                            await GetCuisineTypeName(
                                restaurant.cuisine_type
                            );

                        var restaurantDTO =
                            new RestaurantDTO
                            {
                                Id = restaurant.id,
                                Name = restaurant.name,
                                Description = restaurant.description,
                                City = restaurant.city,
                                Address = restaurant.address,
                                PhoneNumber = restaurant.phone_number,
                                OpeningTime = restaurant.opening_time,
                                ClosingTime = restaurant.closing_time,
                                Rating = restaurant.rating,
                                Price = restaurant.price,
                                CuisineType = cuisineType,
                                ReservationDuration =
                                    restaurant.reservation_duration,
                            };

                        restaurantDTOs =
                            restaurantDTOs.Append(restaurantDTO);
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine(
                            $"Error processing restaurant with ID {restaurant.id}: {ex.Message}"
                        );
                    }
                }

                return new GetRestaurantsResponse
                {
                    Items = restaurantDTOs.ToList(),
                    Page = result.Page,
                    PageSize = result.PageSize,
                    TotalCount = result.TotalCount,
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Error retrieving restaurants: {ex.Message}"
                );

                return new GetRestaurantsResponse
                {
                    Items = [],
                    Page = request.Page,
                    PageSize = request.PageSize,
                    TotalCount = 0,
                };
            }
        }

        internal async Task<RestaurantDTO?> GetRestaurantByIdAsync(int id)
        {
            RestaurantDTO getRestaurantDTO = new RestaurantDTO();

            try
            {
                var restaurant =
                    await _restaurantsRepository.GetRestaurantByIdAsync(id);

                if (restaurant == null)
                {
                    Console.WriteLine(
                        $"Restaurant with ID {id} not found."
                    );

                    return null;
                }

                var cuisineType =
                    await GetCuisineTypeName(
                        restaurant.cuisine_type
                    );

                getRestaurantDTO.Id = restaurant.id;
                getRestaurantDTO.Name = restaurant.name;
                getRestaurantDTO.Description = restaurant.description;
                getRestaurantDTO.City = restaurant.city;
                getRestaurantDTO.Address = restaurant.address;
                getRestaurantDTO.PhoneNumber =restaurant.phone_number;
                getRestaurantDTO.OpeningTime = restaurant.opening_time;
                getRestaurantDTO.ClosingTime = restaurant.closing_time;
                getRestaurantDTO.Rating = restaurant.rating;
                getRestaurantDTO.Price = restaurant.price;
                getRestaurantDTO.CuisineType = cuisineType;
                getRestaurantDTO.ReservationDuration = restaurant.reservation_duration;
                getRestaurantDTO.Image =
                    restaurant.image is { Length: > 0 }
                        ? Convert.ToBase64String(
                            restaurant.image
                        )
                        : null;
            }
            catch (Exception e)
            {
                Console.WriteLine(
                    $"Error retrieving restaurant with ID {id}: {e.Message}"
                );

                return null;
            }

            return getRestaurantDTO;
        }
        
        internal async Task<GetRestaurantInfoResponse?> GetRestaurantInfoAsync(int id)
        {
            GetRestaurantInfoResponse restaurantInfoResponse = new();
            try
            {
                var restaurant = await _restaurantsRepository.GetRestaurantByIdAsync(id);
                if (restaurant == null)
                {
                    Console.WriteLine($"Restaurant with ID {id} not found.");
                    return null;
                }
                var tables = await _restaurantsRepository.GetTablesForRestaurantAsync(id);
                IEnumerable<TableGroup> tableGroups = [];
                foreach(var table in tables)
                {
                    try
                    {
                        TableGroup tableGroup = new TableGroup
                        {
                            Id = table.id,
                            Location = table.location,
                            Capacity = table.seats,
                            TableCount = table.total_table_number
                        };
                        tableGroups = tableGroups.Append(tableGroup);
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine($"Error processing table with ID {table.id}: {e.Message}");
                    }
                }

                var cuisine_type = await GetCuisineTypeName(restaurant.cuisine_type);

                restaurantInfoResponse.RestaurantName = restaurant.name;
                restaurantInfoResponse.RestaurantAddress = restaurant.address;
                restaurantInfoResponse.RestaurantCity = restaurant.city;
                restaurantInfoResponse.OpeningTime = restaurant.opening_time;
                restaurantInfoResponse.ClosingTime = restaurant.closing_time;
                restaurantInfoResponse.ReservationDurationMinutes = restaurant.reservation_duration;
                restaurantInfoResponse.TableGroups = tableGroups;
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error retrieving restaurant info with ID {id}: {e.Message}");
                return null;
            }
            return restaurantInfoResponse;
        }

        internal async Task<TableDTO?> GetTableAsync(int id)
        {
            TableDTO tableDTO = new TableDTO();
            try
            {
                var table = await _restaurantsRepository.GetTableAsync(id);
                if (table == null)
                {
                    return null;
                }

                tableDTO.Id = table.id;
                tableDTO.RestaurantId = table.restaurant_id;
                tableDTO.Location = table.location;
                tableDTO.Seats = table.seats;
                tableDTO.AvailableNumber = table.total_table_number;
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error retrieving table with ID {id}: {e.Message}");
                return null;
            }

            return tableDTO;
        }

        internal async Task<IEnumerable<MenuItemDTO>> GetMenuForRestaurantAsync(int restaurantId)
        {
            IEnumerable<MenuItemDTO> menuItemDTOs = [];

            try
            {
                var menuItems = await _restaurantsRepository.GetMenuItemsAsync(restaurantId);

                foreach (var menuItem in menuItems)
                {
                    try
                    {
                        MenuItemDTO menuItemDTO = new MenuItemDTO
                        {
                            Id = menuItem.id,
                            RestaurantId = menuItem.restaurant_id,
                            FoodName = menuItem.food_name,
                            Description = menuItem.description,
                            Price = menuItem.price,
                            Image = menuItem.image != null ? Convert.ToBase64String(menuItem.image) : null,
                            Category = menuItem.category
                        };
                        menuItemDTOs = menuItemDTOs.Append(menuItemDTO);
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine($"Error processing menu item with ID {menuItem.id}: {e.Message}");
                    }
                }
            }
            catch(Exception e)
            {
                Console.WriteLine($"Error retrieving menu items: {e.Message}");
                return [];
            }
            
            return menuItemDTOs;
        }

        internal async Task<IEnumerable<GetMenuItemsForRestaurantResponse>> GetMenuItemsForRestaurantAsync(int id)
        {
            IEnumerable<GetMenuItemsForRestaurantResponse> response = [];

            try
            {
                var menuItems = await _restaurantsRepository.GetMenuItemsAsync(id);

                foreach (var menuItem in menuItems)
                {
                    try
                    {
                        GetMenuItemsForRestaurantResponse GetMenuItemsForRestaurantResponse = new GetMenuItemsForRestaurantResponse
                        {
                            MenuItemId = menuItem.id,
                            FoodName = menuItem.food_name,
                            Price = menuItem.price,
                        };
                        response = response.Append(GetMenuItemsForRestaurantResponse);
                    }
                    catch (Exception e)
                    {
                        Console.WriteLine($"Error processing menu item with ID {menuItem.id}: {e.Message}");
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error retrieving menu items: {e.Message}");
                return [];
            }

            return response;
        }

        internal async Task<GetRestaurantsFiltersResponse?> GetRestaurantsFiltersAsync()
        {
            GetRestaurantsFiltersResponse filtersResponse = new GetRestaurantsFiltersResponse();
            try
            {
                var cuisines = await _restaurantsRepository.GetCuisinesAsync();
                var rangePrices = await _restaurantsRepository.GetRangePricesAsync();
                filtersResponse.Cuisines = cuisines;
                filtersResponse.RangePrices = rangePrices;
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error retrieving restaurant filters: {e.Message}");
                return null;
            }
            return filtersResponse;
        }

        private async Task<string> GetCuisineTypeName(int cuisineTypeId)
        {
            return await _restaurantsRepository.GetCuisineTypeNameAsync(cuisineTypeId);
        }
    }
}
