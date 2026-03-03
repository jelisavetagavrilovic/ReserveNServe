namespace Reservations.Application.DTOs;

public class CommandResultDto
{
    public bool Success { get; set; }        
    public string? Message { get; set; }     
    public Guid? ReservationId { get; set; } 
}