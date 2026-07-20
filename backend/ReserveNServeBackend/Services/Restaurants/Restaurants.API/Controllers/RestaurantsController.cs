using Azure.Core;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Restaurants.API.DTOs;
using Restaurants.API.DTOs.Requests;
using Restaurants.API.DTOs.Responses;
using Restaurants.API.Entities;
using Restaurants.API.Handler;
using Restaurants.API.Repositories;

namespace Restaurants.API.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    public class RestaurantsController : ControllerBase
    {
        private RestaurantsHandler _restaurantsHandler;
        public RestaurantsController(RestaurantsHandler restaurantsHandler)
        {
            _restaurantsHandler = restaurantsHandler;
        }

        [HttpGet("GetRestaurants")]
        public async Task<ActionResult<IEnumerable<RestaurantDTO>>> GetRestaurantsAsync(GetRestaurantsRequest request)
        {
            var getRestaurantsDTOs = await _restaurantsHandler.GetRestaurantsAsync(request);
            if(getRestaurantsDTOs == null)
            {
                return NotFound();
            }
            return Ok(getRestaurantsDTOs);
        }

        [HttpGet("GetRestaurants/{id}")]
        public async Task<ActionResult<RestaurantDTO>> GetRestaurantByIdAsync(int id)
        {
            var getRestaurantsDTO = await _restaurantsHandler.GetRestaurantByIdAsync(id);
            if (getRestaurantsDTO == null)
            {
                return NotFound();
            }
            
            return Ok(getRestaurantsDTO);
        }

        [HttpGet("GetRestaurantInfo/{id}")]
        public async Task<ActionResult<GetRestaurantInfoResponse>> GetRestaurantInfoAsync(int id)
        {
            var restaurantInfo = await _restaurantsHandler.GetRestaurantInfoAsync(id);
            if (restaurantInfo == null)
            {
                return NotFound();
            }
            return Ok(restaurantInfo);
        }

        [HttpGet("GetTable/{id}")]
        public async Task<ActionResult<TableDTO>> GetTableAsync(int id)
        {
            var table = await _restaurantsHandler.GetTableAsync(id);
            if (table == null)
            {
                return NotFound();
            }
            return Ok(table);
        }

        [HttpGet("GetMenuForRestaurant/{id}")]
        public async Task<ActionResult<IEnumerable<MenuItemDTO>>> GetMenuForRestaurant(int id)
        {
            var menuItems = await _restaurantsHandler.GetMenuForRestaurantAsync(id);
            if(menuItems == null)
            {
                return NotFound();
            }
            return Ok(menuItems);
        }

        [HttpGet("GetMenuItemsForRestaurant/{id}")]
        public async Task<ActionResult<IEnumerable<GetMenuItemsForRestaurantResponse>>> GetMenuItemsForRestaurant(int id)
        {
            var menuItems = await _restaurantsHandler.GetMenuItemsForRestaurantAsync(id);
            if (menuItems == null)
            {
                return NotFound();
            }
            return Ok(menuItems);
        }

        [HttpGet("GetRestaurantsFilters")]
        public async Task<ActionResult<IEnumerable<GetRestaurantsFiltersResponse>>> GetRestaurantsFilters()
        {
            var filters = await _restaurantsHandler.GetRestaurantsFiltersAsync();
            if (filters == null)
            {
                return NotFound();
            }
            return Ok(filters);
        }
    }
}
