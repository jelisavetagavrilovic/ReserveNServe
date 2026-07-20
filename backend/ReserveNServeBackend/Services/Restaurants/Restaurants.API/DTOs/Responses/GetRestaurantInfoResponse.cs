namespace Restaurants.API.DTOs.Responses
{
    public class GetRestaurantInfoResponse
    {
        public string RestaurantName { get; set; } = string.Empty;
        public string RestaurantAddress { get; set; } = string.Empty;
        public string RestaurantCity { get; set; } = string.Empty;
        public TimeOnly OpeningTime { get; set; }
        public TimeOnly ClosingTime { get; set; }
        public int ReservationDurationMinutes { get; set; }
        public IEnumerable<TableGroup> TableGroups { get; set; } = [];
    }

    public class TableGroup
    {
        public int Id { get; set; }
        public string Location { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int TableCount { get; set; }
    }
}
