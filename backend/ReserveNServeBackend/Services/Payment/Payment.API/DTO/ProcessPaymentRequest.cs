namespace Payment.API.DTO
{
    public class ProcessPaymentRequest
    {
        public string ReservationId { get; set; }
        public long Amount { get; set; }
        public string Currency { get; set; }
    }
}
