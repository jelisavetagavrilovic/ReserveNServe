using Stripe;

namespace Payment.API.Services;

public interface IStripePaymentService
{
    Task<PaymentIntent> GetPaymentIntentAsync(string paymentIntentId);
    Task<PaymentIntent> CreatePaymentIntentAsync(PaymentIntentCreateOptions options);
    Refund CreateRefund(RefundCreateOptions options);
}
