using Reservations.Application.Common.Pagination;
using Reservations.Application.DTOs.Requests;
using Reservations.Domain.Entities;

namespace Reservations.Application.Interfaces;

public interface IReservationRepository
{
    Task<Reservation?> GetByIdAsync(Guid id);

    Task<PaginatedResult<Reservation>> GetForUserAsync(
        Guid userId,
        ReservationQueryRequest query);

    Task AddAsync(Reservation reservation);

    Task UpdateAsync(Reservation reservation);

    Task<bool> ExistsAsync(Guid id);
    
    Task<int> CountActiveReservationsAsync(
        int tableGroupId,
        DateTime startTime,
        DateTime endTime,
        Guid? reservationIdToIgnore = null);
}