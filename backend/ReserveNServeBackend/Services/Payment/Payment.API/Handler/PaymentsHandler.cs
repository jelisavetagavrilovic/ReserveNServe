using Payment.API.Enums;
using Payment.API.Messaging;
using Payment.API.Repositories;
using Stripe;

namespace Payment.API.Handler;

public class PaymentsHandler
{
    private readonly IPaymentsRepository _paymentsRepository;
    private readonly IPaymentStatusPublisher _paymentStatusPublisher;

    public PaymentsHandler(
        IPaymentsRepository paymentsRepository,
        IPaymentStatusPublisher paymentStatusPublisher)
    {
        _paymentsRepository = paymentsRepository;
        _paymentStatusPublisher = paymentStatusPublisher;
    }

    public void InsertNewPaymentAsync(Entities.Payment payment)
    {
        try
        {
            _paymentsRepository.InsertNewPayment(payment);
        }
        catch (Exception ex)
        {
            throw new Exception("An error occurred while inserting the payment.", ex);
        }
    }

    public async Task UpdatePaymentStatusAsync(int paymentId, PaymentStatus status)
    {
        await _paymentsRepository.UpdatePaymentStatus(paymentId, (int)status);
    }

    public async Task<Entities.Payment> GetPaymentByReservationIdAsync(string reservationId)
    {
        var payment = await _paymentsRepository.GetPaymentByReservationId(reservationId);
        return payment;
    }

    public async Task<Entities.Payment> GetPaymentByIntentIdAsync(string intentId)
    {
        var payment = await _paymentsRepository.GetPaymentByIntentIdAsync(intentId);
        return payment;
    }

    public bool IsAmountValid(decimal amount)
    {
        return amount > 0;
    }
    
    public bool IsReservationIdValid(string reservationId)
    {
        return !string.IsNullOrWhiteSpace(reservationId);
    }

    public async Task HandleWebhookAsync(Event stripeEvent)
    {
        switch (stripeEvent.Type)
        {
            case EventTypes.PaymentIntentSucceeded:
                await HandlePaymentSucceeded(stripeEvent);
                break;

            case EventTypes.PaymentIntentPaymentFailed:
                await HandlePaymentFailed(stripeEvent);
                break;

            case EventTypes.RefundCreated:
            case EventTypes.RefundUpdated:
            case EventTypes.RefundFailed:
                await HandleRefundChanged(stripeEvent);
                break;
        }
    }

    private async Task HandlePaymentSucceeded(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not PaymentIntent paymentIntent) return;
    
        var payment = await GetPaymentByIntentIdAsync(paymentIntent.Id);
        if (payment == null) return;
    
        var currentStatus = (PaymentStatus)payment.status;
        if (currentStatus == PaymentStatus.PaymentSucceeded) return;
    
        if (currentStatus != PaymentStatus.PaymentPending &&
            currentStatus != PaymentStatus.PaymentFailed)
            return;
    
        await UpdatePaymentStatusAsync(payment.id, PaymentStatus.PaymentSucceeded);
    
        await _paymentStatusPublisher.PublishAsync(
            payment.reservation_id,
            PaymentStatus.PaymentSucceeded
        );
    }

    private async Task HandlePaymentFailed(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not PaymentIntent paymentIntent) return;
    
        var payment = await GetPaymentByIntentIdAsync(paymentIntent.Id);
        if (payment == null) return;
    
        var currentStatus = (PaymentStatus)payment.status;
        if (currentStatus == PaymentStatus.PaymentFailed) return;
        if (currentStatus != PaymentStatus.PaymentPending) return;
    
        await UpdatePaymentStatusAsync(payment.id, PaymentStatus.PaymentFailed);
    
        await _paymentStatusPublisher.PublishAsync(
            payment.reservation_id,
            PaymentStatus.PaymentFailed
        );
    }

    private async Task HandleRefundChanged(Event stripeEvent)
    {
        if (stripeEvent.Data.Object is not Refund refund)
            return;

        if (string.IsNullOrWhiteSpace(refund.PaymentIntentId))
            return;

        var payment = await GetPaymentByIntentIdAsync(refund.PaymentIntentId);

        if (payment == null)
            return;

        var newStatus = refund.Status switch
        {
            "succeeded" => PaymentStatus.RefundSucceeded,
            "failed" => PaymentStatus.RefundFailed,
            "canceled" => PaymentStatus.RefundFailed,
            _ => PaymentStatus.RefundPending
        };

        if (payment.status == (int)newStatus)
            return;

        await UpdatePaymentStatusAsync(payment.id, newStatus);

        await _paymentStatusPublisher.PublishAsync(
            payment.reservation_id,
            newStatus);
    }
}