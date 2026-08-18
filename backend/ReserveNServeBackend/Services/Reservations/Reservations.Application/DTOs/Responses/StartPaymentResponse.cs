using Reservations.Domain.ValueObjects;

namespace Reservations.Application.DTOs.Responses;

public class StartPaymentResponse
{
    public Guid ReservationId { get; set; }

    public string ClientSecret { get; set; } = string.Empty;

    public ReservationPaymentStatus PaymentStatus { get; set; }
}