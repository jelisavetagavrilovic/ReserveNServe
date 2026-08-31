namespace Reservations.Application.DTOs.External.Payment;

public class PaymentStatusUpdateRequest
{
    public Guid ReservationId { get; set; }

    public PaymentStatus Status { get; set; }
    public string? ReceiptUrl { get; set; }
}