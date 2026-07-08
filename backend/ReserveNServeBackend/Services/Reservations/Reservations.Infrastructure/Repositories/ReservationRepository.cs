using Microsoft.EntityFrameworkCore;
using Reservations.Application.Interfaces;
using Reservations.Domain.Entities;
using Reservations.Infrastructure.DatabaseContext;

namespace Reservations.Infrastructure.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly ReservationsDbContext _context;

    public ReservationRepository(ReservationsDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Reservation reservation)
    {
        await _context.Reservations.AddAsync(reservation);
        await _context.SaveChangesAsync();
    }

    public async Task<Reservation?> GetByIdAsync(Guid id)
    {
        return await _context.Reservations
            .Include(r => r.Orders)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task UpdateAsync(Reservation reservation)
    {
        _context.Reservations.Update(reservation);
        await _context.SaveChangesAsync();
    }

    public async Task<List<Reservation>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Reservations
            .Include(r => r.Orders)
            .Where(r => r.UserId == userId)
            .ToListAsync();
    }
    
    public async Task<List<Reservation>> GetByRestaurantIdAsync(int restaurantId)
    {
        return await _context.Reservations
            .Include(r => r.Orders)
            .Where(r => r.RestaurantId == restaurantId)
            .ToListAsync();
    }
}