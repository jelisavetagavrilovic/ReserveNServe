using System.ComponentModel.DataAnnotations;

namespace Payment.API.DTO
{
    public class CreatePaymentIntentRequest
    {
        [Required]
        public string ReservationId { get; set; }
        [Required]
        public decimal Amount { get; set; }
        [Required]
        public string Currency { get; set; }
    }
}
