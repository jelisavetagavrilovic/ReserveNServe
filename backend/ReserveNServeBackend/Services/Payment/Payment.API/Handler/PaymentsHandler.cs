using Payment.API.Enums;
using Payment.API.Repositories;
using Stripe;

namespace Payment.API.Handler
{
    public class PaymentsHandler(IPaymentsRepository paymentsRepository)
    {
        private IPaymentsRepository _paymentsRepository = paymentsRepository;

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


        public async Task<Entities.Payment> GetPaymentByReservationIdAsync(string reservationId)
        {
            var payment = await _paymentsRepository.GetPaymentByReservationId(reservationId);
            return payment;
        }
        public async Task<Entities.Payment> GetPaymentByIntentIdAsync(string intent)
        {
            var payment = await _paymentsRepository.GetPaymentByIntentIdAsync(intent);
            return payment;
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
                    await HandleRefundCreated(stripeEvent);
                    break;

                case EventTypes.RefundFailed:
                    await HandleRefundFailed(stripeEvent);
                    break;
            }
        }

        public bool IsAmountValid(decimal amount)
        {
            return amount > 0;
        }
        public bool IsReservationIdValid(string reservationId)
        {
            return !string.IsNullOrWhiteSpace(reservationId);
        }

        private async Task HandlePaymentSucceeded(Event stripeEvent)
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
            if (paymentIntent == null)
                return;

            var payment = await GetPaymentByIntentIdAsync(paymentIntent.Id);
            if (payment == null)
                return;

            if (payment.status != (int)PaymentStatus.PaymentPending)
                return;


            await _paymentsRepository.UpdatePaymentStatus(payment.id, (int)PaymentStatus.PaymentSucceeded);

            //TODO sent to reservationService {reservationId, newStatus}
        }
        private async Task HandlePaymentFailed(Event stripeEvent)
        {
            var paymentIntent = stripeEvent.Data.Object as PaymentIntent;
            if (paymentIntent == null)
                return;

            var payment = await GetPaymentByIntentIdAsync(paymentIntent.Id);
            if (payment == null)
                return;

            if (payment.status != (int)PaymentStatus.PaymentPending && payment.status != (int)PaymentStatus.PaymentFailed)
                return;

            await _paymentsRepository.UpdatePaymentStatus(payment.id, (int)PaymentStatus.PaymentFailed);

            //TODO send to reservationService {reservationId, newStatus}
        }

        private async Task HandleRefundCreated(Event stripeEvent)
        {
            var refund = stripeEvent.Data.Object as Refund;
            if (refund == null)
                return;

            var paymentIntentId = refund.PaymentIntentId;
            if (string.IsNullOrEmpty(paymentIntentId))
                return;

            var payment = await GetPaymentByIntentIdAsync(paymentIntentId);
            if (payment == null)
                return;

            if (payment.status != (int)PaymentStatus.RefundPending && payment.status != (int)PaymentStatus.PaymentSucceeded && payment.status != (int)PaymentStatus.RefundFailed)
                return;

            await _paymentsRepository.UpdatePaymentStatus(payment.id, (int)PaymentStatus.RefundSucceeded);

            //TODO send to reservationService {reservationId, newStatus}
        }
        private async Task HandleRefundFailed(Event stripeEvent)
        {
            var refund = stripeEvent.Data.Object as Refund;
            if (refund == null)
                return;

            var paymentIntentId = refund.PaymentIntentId;
            if (string.IsNullOrEmpty(paymentIntentId))
                return;

            var payment = await GetPaymentByIntentIdAsync(paymentIntentId);
            if (payment == null)
                return;

            if (payment.status != (int)PaymentStatus.RefundPending)
                return;

            await _paymentsRepository.UpdatePaymentStatus(payment.id, (int)PaymentStatus.RefundFailed);

            //TODO send to reservationService {reservationId, newStatus}
        }
    }
}
