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
        public TimeSpan opening_time_workday { get; set; }
        public TimeSpan closing_time_workday { get; set; }
        public TimeSpan opening_time_weekend { get; set; }
        public TimeSpan closing_time_weekend { get; set; }
        public double rating { get; set; }
        public string price_range { get; set; }
        public string cusine_type { get; set; }
        public int reservation_duration { get; set; }
        public byte[]? image { get; set; }
    }
}
