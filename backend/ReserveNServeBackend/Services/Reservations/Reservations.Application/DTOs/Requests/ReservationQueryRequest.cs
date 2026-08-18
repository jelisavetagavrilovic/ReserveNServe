using Reservations.Domain.ValueObjects;

namespace Reservations.Application.DTOs.Requests;

public class ReservationQueryRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 5;
    public ReservationType? Type { get; set; }
    public ReservationStatus? Status { get; set; }
}