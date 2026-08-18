namespace Restaurants.API.Entities
{
    public class Restaurant
    {
        public int id { get; set; }
        public string name { get; set; }
        public string? description { get; set; }
        public string city { get; set; }
        public string address { get; set; }
        public string phone_number { get; set; }
        public TimeOnly opening_time { get; set; }
        public TimeOnly closing_time { get; set; }
        public double rating { get; set; }
        public string price { get; set; }
        public int cuisine_type { get; set; }
        public int reservation_duration { get; set; }
        public byte[]? image { get; set; }
    }
}
