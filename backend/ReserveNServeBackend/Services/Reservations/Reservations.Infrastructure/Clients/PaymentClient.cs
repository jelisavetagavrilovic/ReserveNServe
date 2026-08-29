using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.Interfaces;

using Contracts =
    ReserveNServe.Contracts.Payment;

namespace Reservations.Infrastructure.Clients;

public class PaymentClient : IPaymentClient
{
    private readonly Contracts
        .PaymentsService
        .PaymentsServiceClient _client;


    public PaymentClient(
        Contracts
            .PaymentsService
            .PaymentsServiceClient client)
    {
        _client = client;
    }


    public async Task<CreatePaymentResponse>
        CreatePaymentAsync(
            CreatePaymentRequest request)
    {
        var amountMinor =
            decimal.ToInt64(
                decimal.Round(
                    request.Amount * 100m,
                    0,
                    MidpointRounding.AwayFromZero));


        var response =
            await _client.CreatePaymentAsync(
                new Contracts
                    .CreatePaymentGrpcRequest
                {
                    ReservationId = request.ReservationId.ToString(),
                    AmountMinor = amountMinor,
                    Currency = request.Currency
                });


        return new CreatePaymentResponse
        {
            ClientSecret = response.ClientSecret,
            Status = MapStatus(response.Status)
        };
    }


    public async Task<RefundPaymentResponse>
        RefundPaymentAsync(
            RefundPaymentRequest request)
    {
        var response =
            await _client.RefundPaymentAsync(
                new Contracts
                    .RefundPaymentGrpcRequest
                {
                    ReservationId = request.ReservationId.ToString(),
                    Reason = request.Reason ?? string.Empty
                });


        return new RefundPaymentResponse
        {
            Status = MapStatus(response.Status)
        };
    }


    private static PaymentStatus MapStatus(
        Contracts.PaymentStatus status)
    {
        return status switch
        {
            Contracts.PaymentStatus.PaymentPending =>
                PaymentStatus.PaymentPending,

            Contracts.PaymentStatus.PaymentSucceeded =>
                PaymentStatus.PaymentSucceeded,

            Contracts.PaymentStatus.PaymentFailed =>
                PaymentStatus.PaymentFailed,

            Contracts.PaymentStatus.RefundPending =>
                PaymentStatus.RefundPending,

            Contracts.PaymentStatus.RefundSucceeded =>
                PaymentStatus.RefundSucceeded,

            Contracts.PaymentStatus.RefundFailed =>
                PaymentStatus.RefundFailed,

            _ =>
                throw new ArgumentOutOfRangeException(
                    nameof(status),
                    status,
                    "Unsupported payment status.")
        };
    }
}