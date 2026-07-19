
using Reservations.Application.Common.Pagination;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.DTOs.Responses;

namespace Reservations.Application.Interfaces;


public interface IReservationService
{
    Task<ReservationResponse> CreateReservationAsync(
        Guid userId,
        CreateReservationRequest request);

    Task<ReservationResponse> GetReservationByIdAsync(
        Guid reservationId,
        Guid userId);

    Task<PaginatedResult<ReservationResponse>> GetUserReservationsAsync(
        Guid userId,
        ReservationQueryRequest request);

    Task<ReservationResponse> UpdateReservationAsync(
        Guid reservationId,
        Guid userId,
        UpdateReservationRequest request);

    Task<ReservationResponse> ReplaceOrdersAsync(
        Guid reservationId,
        Guid userId,
        UpdateReservationOrdersRequest request);

    Task CancelReservationAsync(
        Guid reservationId,
        Guid userId);

    Task ConfirmPaymentAsync(
        Guid reservationId);

    Task MarkPaymentFailedAsync(
        Guid reservationId);
    
    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int restaurantId,
        DateOnly date);

    Task<List<AvailableTableResponse>> GetAvailableTablesAsync(
        int restaurantId,
        DateOnly date,
        TimeOnly time);
}