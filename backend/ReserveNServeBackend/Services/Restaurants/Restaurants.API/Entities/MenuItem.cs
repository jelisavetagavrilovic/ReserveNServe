namespace Restaurants.API.Entities
{
    public class MenuItem
    {
        public int id { get; set; }
        public int restaurant_id { get; set; }
        public string food_name { get; set; }
        public string description { get; set; }
        public decimal price { get; set; }
        public string? image { get; set; }
        public string category { get; set; }
    }
}
