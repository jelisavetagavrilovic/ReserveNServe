namespace Restaurants.API.DTOs.Responses
{
    public class GetMenuItemsForRestaurantResponse
    {
        public int MenuItemId { get; set; }

        public string FoodName { get; set; } = string.Empty;

        public decimal Price { get; set; }
    }
}
