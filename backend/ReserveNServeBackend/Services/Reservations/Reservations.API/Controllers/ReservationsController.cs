using MediatR;
using Microsoft.AspNetCore.Mvc;
using Reservations.Application.Commands;
using Reservations.Application.DTOs;
using Reservations.Application.Queries;

namespace Reservations.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IMediator _mediator;
    
    public  ReservationsController(IMediator mediator)
    {
        _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
    }

    // create new reservation
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ReservationDto dto)
    {
        var command = new CreateReservationCommand
        {
            RestaurantId = dto.RestaurantId,
            TableGroupId = dto.TableGroupId,
            Date = dto.Date,
            StartTime = dto.StartTime,
            GuestNumber = dto.GuestNumber,
            ServingTime = dto.ServingTime,
            Orders = dto.Orders
        };

        var result = await _mediator.Send(command);
        return result.Success ? Ok(result) : Conflict(result);
    }
    
    // get reservation by id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetReservationByIdQuery { ReservationId = id });

        if (result == null)
            return NotFound(new { message = "Reservation not found." });

        return Ok(result);
    }
    
    // update reservation
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateReservationCommand command)
    {
        if (id != command.Id)
            return BadRequest(new { message = "Id mismatch" });

        var result = await _mediator.Send(command);

        if (!result.Success)
            return Conflict(result);
        
        return Ok(result);
    }
    
    // cancel reservation
    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> CancelReservation(Guid id)
    {
        var result = await _mediator.Send(new CancelReservationCommand(id));

        if (!result.Success)
            return BadRequest(result);

        return Ok(result);
    }
    
    // get reservations by user
    [HttpGet]
    public async Task<IActionResult> GetMyReservations()
    {
        var result = await _mediator.Send(new GetReservationsByUserQuery());
        return Ok(result);
    }
    
    // get availability for tables
    [HttpGet("{restaurantId}/available-tables")]
    public async Task<IActionResult> GetAvailableTables(
        int restaurantId,
        [FromQuery] string date,
        [FromQuery] string time,
        [FromQuery] int guestNumber = 1)
    {
        var query = new GetTablesWithAvailabilityQuery()
        {
            RestaurantId = restaurantId,
            Date = date,
            Time = time,
            GuestNumber = guestNumber
        };

        var result = await _mediator.Send(query);
        return Ok(result);
    }
}