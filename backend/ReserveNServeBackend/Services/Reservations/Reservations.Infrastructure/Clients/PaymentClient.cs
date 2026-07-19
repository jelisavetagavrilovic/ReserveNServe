using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Clients;

public class PaymentClient : IPaymentClient
{
    public Task<CreatePaymentResponse> CreatePaymentAsync(
        CreatePaymentRequest request)
    {
        return Task.FromResult(new CreatePaymentResponse());
    }

    public Task RefundPaymentAsync(Guid reservationId)
    {
        return Task.CompletedTask;
    }
}