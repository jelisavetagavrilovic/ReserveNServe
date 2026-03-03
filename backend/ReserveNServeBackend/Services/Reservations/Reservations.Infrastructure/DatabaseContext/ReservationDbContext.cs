using Microsoft.EntityFrameworkCore;
using Reservations.Domain.Entities;

namespace Reservations.Infrastructure.DatabaseContext;

public class ReservationDbContext : DbContext
{
    public ReservationDbContext(DbContextOptions<ReservationDbContext> options)
        : base(options)
    {
    }

    // create tables in database
    public DbSet<Reservation> Reservations { get; set; }
    public DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // reservation -> orders
        modelBuilder.Entity<Reservation>()
            .HasMany(r => r.Orders)
            .WithOne(o => o.Reservation)
            .HasForeignKey(o => o.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);

        
        modelBuilder.Entity<Reservation>()
            .Property(r => r.TotalAmount);
            //.HasColumnType("decimal(10,2)");

        modelBuilder.Entity<Order>()
            .Property(o => o.Price);
            //.HasColumnType("decimal(10,2)");
    }
    
}