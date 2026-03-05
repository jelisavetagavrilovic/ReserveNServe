namespace Restaurants.API.DTOs
{
    public class GetMenuItemsRequest
    {
        public int restaurantId { get; set; }
        public List<int> ids { get; set; }
    }
}
