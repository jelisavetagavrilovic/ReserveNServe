using System.Runtime.InteropServices.JavaScript;
using MediatR;
using Reservations.Application.DTOs;

namespace Reservations.Application.Commands;

public class UpdateReservationCommand : IRequest<CommandResultDto>
{
    public Guid Id { get; set; }                   
    public int TableGroupId { get; set; }          
    public string Date { get; set; }   
    public string StartTime { get; set; }
    public int GuestNumber { get; set; }           

    public List<OrderDto> Orders { get; set; } = new();  
    public TimeSpan? ServingTime { get; set; }         
}