using Microsoft.EntityFrameworkCore;
using Payment.API.Entities;

namespace Payment.API.Data
{
    public class PaymentsContext : DbContext
    {
        public DbSet<Entities.Payment> Payments { get; set; } = null!;

        public PaymentsContext(DbContextOptions<PaymentsContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
        }
    }
}
