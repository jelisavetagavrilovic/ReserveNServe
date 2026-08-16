using Reservations.Application.DTOs.External.Payment;

namespace Reservations.Application.Interfaces;

public interface IPaymentClient
{
    Task<CreatePaymentResponse> CreatePaymentAsync(
        CreatePaymentRequest request);

    Task<RefundPaymentResponse> RefundPaymentAsync(
        RefundPaymentRequest request);
}