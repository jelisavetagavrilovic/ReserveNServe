using Grpc.Core;
using Payment.API.Enums;
using Payment.API.Handler;
using Stripe;

using Contracts = ReserveNServe.Contracts.Payment;

namespace Payment.API.Grpc;

public class PaymentsGrpcService : Contracts.PaymentsService.PaymentsServiceBase
{
    private readonly PaymentsHandler _paymentHandler;

    public PaymentsGrpcService(PaymentsHandler paymentHandler)
    {
        _paymentHandler = paymentHandler;
    }

    // ========================================================================
    // CREATE PAYMENT
    // ========================================================================

    public override async Task<Contracts.CreatePaymentGrpcReply> CreatePayment(
        Contracts.CreatePaymentGrpcRequest request,
        ServerCallContext context)
    {
        if (string.IsNullOrWhiteSpace(request.ReservationId))
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                "Reservation ID is required."));

        if (request.AmountMinor <= 0)
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                "Amount must be greater than zero."));

        /*
         * One logical payment per reservation.
         *
         * If Payment already exists, return the existing
         * Stripe PaymentIntent instead of creating another one.
         */
        var existingPayment =
            await _paymentHandler.GetPaymentByReservationIdAsync(request.ReservationId);

        if (existingPayment != null)
        {
            try
            {
                var paymentIntentService = new PaymentIntentService();
                var paymentIntent =
                    await paymentIntentService.GetAsync(existingPayment.payment_intent);

                return new Contracts.CreatePaymentGrpcReply
                {
                    ClientSecret = paymentIntent.ClientSecret,
                    Status = MapStatus((PaymentStatus)existingPayment.status)
                };
            }
            catch (StripeException ex)
            {
                throw new RpcException(new Status(
                    StatusCode.Internal,
                    $"Unable to load Stripe PaymentIntent: {ex.Message}"));
            }
        }

        var options = new PaymentIntentCreateOptions
        {
            Amount = request.AmountMinor,
            Currency = request.Currency,

            Metadata = new Dictionary<string, string>
            {
                { "reservationId", request.ReservationId }
            },

            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
                AllowRedirects = "never"
            }
        };

        try
        {
            var paymentIntentService = new PaymentIntentService();
            var paymentIntent = await paymentIntentService.CreateAsync(options);

            var payment = new Entities.Payment
            {
                reservation_id = request.ReservationId,
                payment_intent = paymentIntent.Id,
                status = (int)PaymentStatus.PaymentPending
            };

            _paymentHandler.InsertNewPaymentAsync(payment);

            return new Contracts.CreatePaymentGrpcReply
            {
                ClientSecret = paymentIntent.ClientSecret,
                Status = Contracts.PaymentStatus.PaymentPending
            };
        }
        catch (StripeException ex)
        {
            throw new RpcException(new Status(
                StatusCode.Internal,
                $"Stripe payment creation failed: {ex.Message}"));
        }
    }

    // ========================================================================
    // REFUND PAYMENT
    // ========================================================================

    public override async Task<Contracts.RefundPaymentGrpcReply> RefundPayment(
        Contracts.RefundPaymentGrpcRequest request,
        ServerCallContext context)
    {
        if (string.IsNullOrWhiteSpace(request.ReservationId))
            throw new RpcException(new Status(
                StatusCode.InvalidArgument,
                "Reservation ID is required."));

        var payment =
            await _paymentHandler.GetPaymentByReservationIdAsync(request.ReservationId);

        if (payment == null)
            throw new RpcException(new Status(
                StatusCode.NotFound,
                "Payment was not found."));

        var currentStatus = (PaymentStatus)payment.status;

        /*
         * Idempotency.
         *
         * If refund already succeeded or is currently pending,
         * do not create another Stripe refund.
         */
        if (currentStatus == PaymentStatus.RefundSucceeded)
        {
            return new Contracts.RefundPaymentGrpcReply
            {
                Status = Contracts.PaymentStatus.RefundSucceeded
            };
        }

        if (currentStatus == PaymentStatus.RefundPending)
        {
            return new Contracts.RefundPaymentGrpcReply
            {
                Status = Contracts.PaymentStatus.RefundPending
            };
        }

        /*
         * Refund can only start after a successful payment.
         *
         * RefundFailed is allowed so the operation can be retried.
         */
        if (currentStatus != PaymentStatus.PaymentSucceeded &&
            currentStatus != PaymentStatus.RefundFailed)
        {
            throw new RpcException(new Status(
                StatusCode.FailedPrecondition,
                $"Payment cannot be refunded in status {currentStatus}."));
        }

        await _paymentHandler.UpdatePaymentStatusAsync(
            payment.id,
            PaymentStatus.RefundPending);

        try
        {
            var refundService = new RefundService();

            var refund = await refundService.CreateAsync(
                new RefundCreateOptions
                {
                    PaymentIntent = payment.payment_intent,
                    Reason = RefundReasons.RequestedByCustomer
                });

            /*
             * Stripe can finish the refund immediately,
             * or return a status that is still being processed.
             *
             * Webhook processing remains the final source
             * of truth for asynchronous status changes.
             */
            var refundStatus = refund.Status switch
            {
                "succeeded" => PaymentStatus.RefundSucceeded,
                "failed" => PaymentStatus.RefundFailed,
                "canceled" => PaymentStatus.RefundFailed,
                _ => PaymentStatus.RefundPending
            };

            await _paymentHandler.UpdatePaymentStatusAsync(
                payment.id,
                refundStatus);

            return new Contracts.RefundPaymentGrpcReply
            {
                Status = MapStatus(refundStatus)
            };
        }
        catch (StripeException ex)
        {
            await _paymentHandler.UpdatePaymentStatusAsync(
                payment.id,
                PaymentStatus.RefundFailed);

            throw new RpcException(new Status(
                StatusCode.Internal,
                $"Stripe refund failed: {ex.Message}"));
        }
    }

    // ========================================================================
    // STATUS MAPPING
    // ========================================================================

    private static Contracts.PaymentStatus MapStatus(PaymentStatus status)
    {
        return status switch
        {
            PaymentStatus.PaymentPending =>
                Contracts.PaymentStatus.PaymentPending,

            PaymentStatus.PaymentSucceeded =>
                Contracts.PaymentStatus.PaymentSucceeded,

            PaymentStatus.PaymentFailed =>
                Contracts.PaymentStatus.PaymentFailed,

            PaymentStatus.RefundPending =>
                Contracts.PaymentStatus.RefundPending,

            PaymentStatus.RefundSucceeded =>
                Contracts.PaymentStatus.RefundSucceeded,

            PaymentStatus.RefundFailed =>
                Contracts.PaymentStatus.RefundFailed,

            _ => throw new ArgumentOutOfRangeException(
                nameof(status),
                status,
                "Unsupported payment status.")
        };
    }
}