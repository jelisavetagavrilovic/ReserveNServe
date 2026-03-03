using MediatR;
using Reservations.Application.DTOs;

namespace Reservations.Application.Queries;

public class GetTablesWithAvailabilityQuery : IRequest<List<TableDataDto>>
{
    public int RestaurantId { get; set; }
    public string Date { get; set; }      // "yyyy-MM-dd"
    public string Time { get; set; }      // "HH:mm"
    public int GuestNumber { get; set; }  
}