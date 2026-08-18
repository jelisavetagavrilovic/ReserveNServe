namespace Restaurants.API.DTOs.Requests
{
    public class GetRestaurantsRequest
    {
        public string? search { get; set; }
        public string? cuisine_type { get; set; }
        public string? price { get; set; }
        public string? sort_by { get; set; }
        public int page { get; set; }
        public int page_size { get; set; }
    }
}
