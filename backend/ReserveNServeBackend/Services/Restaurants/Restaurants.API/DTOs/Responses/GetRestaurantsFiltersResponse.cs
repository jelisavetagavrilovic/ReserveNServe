namespace Restaurants.API.DTOs.Responses
{
    public class GetRestaurantsFiltersResponse
    {
        public IEnumerable<string> Cuisines { get; set; }
        public IEnumerable<string> RangePrices { get; set; }
    }
}
