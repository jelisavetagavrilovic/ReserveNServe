
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
        public async Task<Entities.Payment> GetPaymentByIntentIdAsync(string intentId)
        {
            return await _context.Payments.Where(e => e.payment_intent == intentId).FirstOrDefaultAsync();
        }

        public async Task UpdatePaymentStatus(int id, int status)
        {
            try
            {
                var payment = await _context.Payments.Where(e => e.id == id).FirstOrDefaultAsync();
                if (payment != null)
                {
                    payment.status = status;
                    _context.Entry(payment).Property(e => e.status).IsModified = true;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"An error occurred while updating the payment status: {ex.Message}", ex);
            }
        }
    }
}
