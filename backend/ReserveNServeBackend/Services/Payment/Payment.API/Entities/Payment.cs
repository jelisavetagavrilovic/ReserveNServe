namespace Payment.API.Entities
{
    public class Payment
    {
        public int id { get; set; }
        public string reservation_id { get; set; }
        public string payment_intent { get; set; }
        public int status { get; set; }
    }
}
