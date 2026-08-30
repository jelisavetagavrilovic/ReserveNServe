namespace Restaurants.API.DTOs.Responses
{
    public class GetRestaurantsResponse
    {
        public IReadOnlyList<RestaurantDTO> Items { get; set; } = [];
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }

        public int TotalPages =>
            PageSize > 0
                ? (int)Math.Ceiling((double)TotalCount / PageSize)
                : 0;
    }
}