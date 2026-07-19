/// <summary>
/// API controller responsible for managing restaurant reservations.
/// Provides endpoints for creating, retrieving, updating and cancelling reservations.
/// </summary>

using Microsoft.AspNetCore.Mvc;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.Interfaces;

namespace Reservations.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationsController(
        IReservationService reservationService)
    {
        _reservationService = reservationService;
    }


    [HttpPost]
    public async Task<IActionResult> CreateReservation(
        CreateReservationRequest request)
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var result = await _reservationService
            .CreateReservationAsync(userId, request);

        return Ok(result);
    }


    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetReservation(
        Guid id)
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var result = await _reservationService
            .GetReservationByIdAsync(id, userId);

        return Ok(result);
    }


    [HttpGet]
    public async Task<IActionResult> GetUserReservations(
        [FromQuery] ReservationQueryRequest request)
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var result = await _reservationService
            .GetUserReservationsAsync(userId, request);

        return Ok(result);
    }


    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateReservation(
        Guid id,
        UpdateReservationRequest request)
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var result = await _reservationService
            .UpdateReservationAsync(
                id,
                userId,
                request);

        return Ok(result);
    }


    [HttpPut("{id:guid}/orders")]
    public async Task<IActionResult> ReplaceOrders(
        Guid id,
        UpdateReservationOrdersRequest request)
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        var result = await _reservationService
            .ReplaceOrdersAsync(
                id,
                userId,
                request);

        return Ok(result);
    }


    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelReservation(
        Guid id)
    {
        var userId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        await _reservationService
            .CancelReservationAsync(
                id,
                userId);

        return NoContent();
    }
}