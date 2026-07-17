namespace Payment.API.Entities
{
    public class Payment
    {
        public int id { get; set; }
        public string reservation_id { get; set; }
        public string charge_id { get; set; }
    }
}
