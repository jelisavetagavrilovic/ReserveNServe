using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Restaurants.API.DTOs;
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
        public async Task<ActionResult<IEnumerable<Restaurant>>> GetRestaurants()
        {
            var restaurants = await _restaurantsHandler.GetRestaurantsAsync();
            return Ok(restaurants);
        }

        [HttpGet("GetTablesForRestaurant/{id}")]
        public async Task<ActionResult<IEnumerable<TableDTO>>> GetTablesForRestaurant(int id)
        {
            var tables = await _restaurantsHandler.GetTablesForRestaurantAsync(id);
            if (tables == null)
            {
                return NotFound();
            }
            return Ok(tables);
        }

        [HttpGet("GetImage/{id}")]
        public async Task<IActionResult> GetImage(int id)
        {
            var image = await _restaurantsHandler.GetImageAsync(id);
            if (image == null)
            {
                return NotFound();
            }
            return File(image, "image/jpeg");
        }

        [HttpPost("GetMenuItemsForRestaurant")]
        public async Task<ActionResult<IEnumerable<MenuItemDTO>>> GetMenuItemsForRestaurant(GetMenuItemsRequest request)
        {
            var menuItems = await _restaurantsHandler.GetMenuItemsAsync(request.ids);
            return Ok(menuItems);
        }

        [HttpGet("GetTable/{id}")]
        public async Task<ActionResult<Table>> GetTable(int id)
        {
            var table = await _restaurantsHandler.GetTableAsync(id);
            if(table == null)
            {
                return NotFound();
            }
            return Ok(table);
        }

        [HttpGet("GetReservationDuration/{id}")]
        public async Task<ActionResult<ReservationDurationDTO>> GetReservationDuration(int id)
        {
            return Ok(await _restaurantsHandler.GetReservationDurationAsync(id));
        }
    }
}
