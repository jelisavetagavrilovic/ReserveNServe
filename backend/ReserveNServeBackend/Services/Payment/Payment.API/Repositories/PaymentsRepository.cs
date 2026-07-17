
using Microsoft.EntityFrameworkCore;
using Payment.API.Data;

namespace Payment.API.Repositories
{
    public class PaymentsRepository(PaymentsContext context) : IPaymentsRepository
    {
        private PaymentsContext _context = context;

        public void InsertNewPayment(Entities.Payment payment)
        {
            _context.Payments.Add(payment);
            _context.SaveChanges();
            return ;
        }

        public async Task<Entities.Payment> GetPaymentByReservationId(string reservationId)
        {
            return await _context.Payments.Where(e => e.reservation_id == reservationId).FirstOrDefaultAsync();
        }
    }
}
