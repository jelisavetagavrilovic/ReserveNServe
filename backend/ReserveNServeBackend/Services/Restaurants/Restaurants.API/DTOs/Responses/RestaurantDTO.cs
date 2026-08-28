namespace Restaurants.API.DTOs.Responses
{
    public class RestaurantDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string City { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public TimeOnly OpeningTime { get; set; }
        public TimeOnly ClosingTime { get; set; }
        public double Rating { get; set; }
        public string Price { get; set; } = string.Empty;
        public string CuisineType { get; set; } = string.Empty;
        public int ReservationDuration { get; set; }
        public string? Image { get; set; }
    }
}