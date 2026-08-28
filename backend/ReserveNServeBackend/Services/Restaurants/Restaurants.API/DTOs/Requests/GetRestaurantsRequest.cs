namespace Restaurants.API.DTOs.Requests
{
    public class GetRestaurantsRequest
    {
        public string? Search { get; set; }
        public string? CuisineType { get; set; }
        public string? Price { get; set; }
        public string? SortBy { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 9;
    }
}