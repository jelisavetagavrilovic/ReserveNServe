// using Microsoft.EntityFrameworkCore;
// using Reservations.Domain.Entities;
//
// namespace Reservations.Infrastructure.DatabaseContext;
//
// public class ReservationsDbContext : DbContext
// {
//     public ReservationsDbContext(DbContextOptions<ReservationsDbContext> options)
//         : base(options)
//     {
//     }
//
//     // create tables in database
//     public DbSet<Reservation> Reservations { get; set; }
//     public DbSet<Order> Orders { get; set; }
//
//     protected override void OnModelCreating(ModelBuilder modelBuilder)
//     {
//         // reservation -> orders
//         modelBuilder.Entity<Reservation>()
//             .HasMany(r => r.Orders)
//             .WithOne(o => o.Reservation)
//             .HasForeignKey(o => o.ReservationId)
//             .OnDelete(DeleteBehavior.Cascade);
//
//         
//         modelBuilder.Entity<Reservation>()
//             .Property(r => r.TotalAmount);
//             //.HasColumnType("decimal(10,2)");
//
//         modelBuilder.Entity<Order>()
//             .Property(o => o.Price);
//             //.HasColumnType("decimal(10,2)");
//     }
//     
// }

using Microsoft.EntityFrameworkCore;
using Reservations.Domain.Entities;

namespace Reservations.Infrastructure.DatabaseContext;

/// <summary>
/// Database context responsible for managing reservation-related entities
/// and their relationships with the database.
/// </summary>
public class ReservationsDbContext : DbContext
{
    public ReservationsDbContext(
        DbContextOptions<ReservationsDbContext> options)
        : base(options)
    {
    }

    // Database tables
    public DbSet<Reservation> Reservations { get; set; }

    public DbSet<Order> Orders { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);


        // Reservation -> Orders relationship
        // One reservation can have many orders.
        // Deleting a reservation deletes its related orders.
        modelBuilder.Entity<Reservation>()
            .HasMany(r => r.Orders)
            .WithOne(o => o.Reservation)
            .HasForeignKey(o => o.ReservationId)
            .OnDelete(DeleteBehavior.Cascade);


        // Money precision configuration
        modelBuilder.Entity<Reservation>()
            .Property(r => r.TotalAmount)
            .HasPrecision(10, 2);


        modelBuilder.Entity<Order>()
            .Property(o => o.Price)
            .HasPrecision(10, 2);


        // Store enum values as strings instead of integers.
        // Example: "Confirmed" instead of 1.
        modelBuilder.Entity<Reservation>()
            .Property(r => r.Status)
            .HasConversion<string>();
    }
}