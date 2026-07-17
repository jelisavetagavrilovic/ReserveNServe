using System.ComponentModel.DataAnnotations;

namespace Payment.API.DTO
{
    public class RefundRequest
    {
        [Required]
        public string ReservationId { get; set; }
    }
}
