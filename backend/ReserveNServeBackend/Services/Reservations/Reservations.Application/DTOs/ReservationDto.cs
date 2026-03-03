using Reservations.Domain.ValueObjects;

namespace Reservations.Application.DTOs;

// request
public class ReservationDto
{
    public Guid Id { get; set; }                // Guid -> string
    // public Guid UserId { get; set; }
    public int RestaurantId { get; set; }
    public int TableGroupId { get; set; }         
    //public DateTime StartTime { get; set; }       // frontend: date + time
    public string Date { get; set; }
    public string StartTime { get; set; }
    public int GuestNumber { get; set; }
    
    public List<OrderDto> Orders { get; set; } = new(); // frontend: preOrders
    
    public TimeSpan? ServingTime { get; set; }    
    // public decimal TotalAmount { get; set; }     
    
    // public ReservationStatus Status { get; set; }            // Pending / Confirmed / Cancelled / Completed
}
