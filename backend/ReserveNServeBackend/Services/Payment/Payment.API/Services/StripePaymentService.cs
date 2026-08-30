using Stripe;

namespace Payment.API.Services;

public class StripePaymentService : IStripePaymentService
{
    private readonly PaymentIntentService _paymentIntentService = new();
    private readonly RefundService _refundService = new();

    public Task<PaymentIntent> GetPaymentIntentAsync(string paymentIntentId)
    {
        return _paymentIntentService.GetAsync(paymentIntentId);
    }

    public Task<PaymentIntent> CreatePaymentIntentAsync(PaymentIntentCreateOptions options)
    {
        return _paymentIntentService.CreateAsync(options);
    }

    public Refund CreateRefund(RefundCreateOptions options)
    {
        return _refundService.Create(options);
    }
}
