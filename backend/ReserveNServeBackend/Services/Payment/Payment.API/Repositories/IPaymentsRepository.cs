
namespace Payment.API.Repositories
{
    public interface IPaymentsRepository
    {
        public void InsertNewPayment(Entities.Payment payment);
        public Task<Entities.Payment> GetPaymentByReservationId(string reservationId);
        public Task<Entities.Payment> GetPaymentByIntentIdAsync(string intentId);
        public Task UpdatePaymentStatus(int id, int status);
    }
}
