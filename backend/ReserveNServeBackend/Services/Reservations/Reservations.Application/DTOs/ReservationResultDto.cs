using Reservations.Domain.ValueObjects;

namespace Reservations.Application.DTOs;

// response

public class ReservationResultDto
{
    public Guid Id { get; set; }
    public int RestaurantId { get; set; }
    public int TableGroupId { get; set; }         
    // private DateTime StartDateTime { get; set; }      
    //public string Date => StartDateTime.ToString("yyyy-MM-dd"); // date

    //public string StartTime => StartDateTime.ToString("HH:mm");   // time
    public string Date { get; set; }
    public string Time { get; set; }

    public int GuestNumber { get; set; }
    public string? ServingTime { get; set; } 
    public decimal TotalAmount { get; set; }
    public List<OrderResultDto> Orders { get; set; } = new();
    public ReservationStatus Status { get; set; }
}