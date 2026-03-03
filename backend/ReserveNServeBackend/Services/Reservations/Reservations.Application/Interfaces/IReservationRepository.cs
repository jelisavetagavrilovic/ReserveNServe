using Reservations.Domain.Entities;

namespace Reservations.Application.Interfaces;

public interface IReservationRepository
{
    Task AddAsync(Reservation reservation); 
    Task<Reservation?> GetByIdAsync(Guid id);
    Task UpdateAsync(Reservation reservation);
    Task<List<Reservation>> GetByUserIdAsync(Guid userId);

    Task<List<Reservation>> GetByRestaurantIdAsync(int requestRestaurantId);
}