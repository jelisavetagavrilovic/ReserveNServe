using Microsoft.EntityFrameworkCore;
using Reservations.Application.Common.Pagination;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.Interfaces;
using Reservations.Domain.Entities;
using Reservations.Domain.ValueObjects;
using Reservations.Infrastructure.DatabaseContext;

namespace Reservations.Infrastructure.Repositories;

public class ReservationRepository : IReservationRepository
{
    private readonly ReservationsDbContext _context;

    public ReservationRepository(ReservationsDbContext context)
    {
        _context = context;
    }

    public async Task<Reservation?> GetByIdAsync(Guid id)
    {
        return await _context.Reservations
            .Include(r => r.Orders)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<PaginatedResult<Reservation>> GetForUserAsync(
        Guid userId,
        ReservationQueryRequest query)
    {
        var now = DateTime.UtcNow;

        var reservations = _context.Reservations
            .AsNoTracking()
            .Include(r => r.Orders)
            .Where(r =>
                r.UserId == userId &&
                r.Status != ReservationStatus.Cancelled);

        if (query.Type.HasValue)
        {
            switch (query.Type.Value)
            {
                case ReservationType.Upcoming:
                    reservations = reservations.Where(r => r.EndTime > now);
                    break;

                case ReservationType.Past:
                    reservations = reservations.Where(r => r.EndTime <= now);
                    break;
            }
        }

        if (query.Status.HasValue)
        {
            reservations = reservations.Where(r => r.Status == query.Status.Value);
        }

        var totalCount = await reservations.CountAsync();

        reservations = query.Type switch
        {
            ReservationType.Upcoming => reservations.OrderBy(r => r.StartTime),
            ReservationType.Past => reservations.OrderByDescending(r => r.StartTime),
            _ => reservations.OrderByDescending(r => r.StartTime)
        };

        var items = await reservations
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        return new PaginatedResult<Reservation>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = totalCount
        };
    }

    public async Task AddAsync(Reservation reservation)
    {
        await _context.Reservations.AddAsync(reservation);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Reservation reservation)
    {
        _context.Reservations.Update(reservation);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Reservations.AnyAsync(r => r.Id == id);
    }

    public async Task<int> CountActiveReservationsAsync(
        int tableGroupId,
        DateTime startTime,
        DateTime endTime,
        Guid? reservationIdToIgnore = null)
    {
        var query = _context.Reservations.Where(r =>
            r.TableGroupId == tableGroupId &&
            r.Status == ReservationStatus.Confirmed &&
            r.StartTime < endTime &&
            r.EndTime > startTime);

        if (reservationIdToIgnore.HasValue)
        {
            query = query.Where(r => r.Id != reservationIdToIgnore.Value);
        }

        return await query.CountAsync();
    }
}