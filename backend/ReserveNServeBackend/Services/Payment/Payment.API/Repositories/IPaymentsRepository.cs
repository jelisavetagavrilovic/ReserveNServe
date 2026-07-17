
namespace Payment.API.Repositories
{
    public interface IPaymentsRepository
    {
        public void InsertNewPayment(Entities.Payment payment);
        public Task<Entities.Payment> GetPaymentByReservationId(string reservationId);
    }
}
