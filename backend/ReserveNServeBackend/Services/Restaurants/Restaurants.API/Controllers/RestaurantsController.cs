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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Restaurant>>> GetRestaurants()
        {
            var restaurants = await _restaurantsHandler.GetRestaurantsAsync();
            return Ok(restaurants);
        }

        //id_restorana -> sve stolove
        [HttpGet("{nameof(GetTablesForRestaurant)}/{id}")]
        public async Task<ActionResult<IEnumerable<TableDTO>>> GetTablesForRestaurant(int id)
        {
            var tables = await _restaurantsHandler.GetTablesForRestaurantAsync(id);
            if (tables == null)
            {
                return NotFound();
            }
            return Ok(tables);
        }

        //id_restorana -> bool exists, trajanje reyervacije, meniItems
    }
}
