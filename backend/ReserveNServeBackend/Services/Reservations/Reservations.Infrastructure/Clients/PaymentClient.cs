using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Clients;

public class PaymentClient : IPaymentClient
{
    public Task<CreatePaymentResponse> CreatePaymentAsync(
        CreatePaymentRequest request)
    {
        var response = new CreatePaymentResponse
        {
            ClientSecret =
                $"temporary-client-secret-{Guid.NewGuid():N}",

            Status = PaymentStatus.PaymentPending
        };

        return Task.FromResult(response);
    }


    public Task<RefundPaymentResponse> RefundPaymentAsync(
        RefundPaymentRequest request)
    {
        var response = new RefundPaymentResponse
        {
            Status = PaymentStatus.RefundPending
        };

        return Task.FromResult(response);
    }
}