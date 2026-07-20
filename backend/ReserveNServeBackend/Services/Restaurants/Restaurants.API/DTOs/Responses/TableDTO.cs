namespace Restaurants.API.DTOs
{
    public class TableDTO
    {
        public int Id { get; set; }
        public int RestaurantId { get; set; }
        public string Location { get; set; }
        public int Seats { get; set; }
        public int AvailableNumber { get; set; }
    }
}
