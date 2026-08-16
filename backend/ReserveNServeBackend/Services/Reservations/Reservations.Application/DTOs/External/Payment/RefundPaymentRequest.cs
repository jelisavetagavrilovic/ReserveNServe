namespace Reservations.Application.DTOs.External.Payment;


public class RefundPaymentRequest
{
    public Guid ReservationId { get; set; }

    public string Reason { get; set; } = string.Empty;
}