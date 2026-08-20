namespace Restaurants.API.Entities
{
    public class Table
    {
        public int id { get; set; }
        public int restaurant_id { get; set; }
        public string location { get; set; }
        public int seats{ get; set; }
        public int total_table_number{ get; set; }
    }
}
