using Payment.API.Repositories;

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

        public bool IsAmountValid(long amount)
        {
            return amount > 0;
        }

        public bool IsReservationIdValid(string reservationId)
        {
            return !string.IsNullOrWhiteSpace(reservationId);
        }
    }
}
