namespace Reservations.Application.DTOs.External.Payment;

public class CreatePaymentRequest
{
    public Guid ReservationId { get; set; }

    public decimal Amount { get; set; }

    public string Currency { get; set; } = "RSD";
}