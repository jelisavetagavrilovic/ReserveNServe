using Reservations.Application.Common.Pagination;
using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.DTOs.Responses;

namespace Reservations.Application.Interfaces;

public interface IReservationService
{
    Task<ReservationResponse> CreateReservationAsync(
        Guid userId,
        string contactEmail,
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

    Task<ReservationResponse> UpdateOrdersAsync(
        Guid reservationId,
        Guid userId,
        UpdateReservationOrdersRequest request);

    Task<StartPaymentResponse> StartPaymentAsync(
        Guid reservationId,
        Guid userId);

    Task CancelReservationAsync(
        Guid reservationId,
        Guid userId);

    Task<List<AvailableSlotResponse>> GetAvailableSlotsAsync(
        int restaurantId,
        DateOnly date,
        int guestNumber);

    Task<List<AvailableTableResponse>> GetAvailableTablesAsync(
        int restaurantId,
        DateOnly date,
        TimeOnly time,
        int guestNumber);

    Task HandlePaymentStatusUpdateAsync(
        PaymentStatusUpdateRequest request);
}