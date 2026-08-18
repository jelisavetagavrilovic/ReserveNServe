/// <summary>
/// API controller responsible for managing restaurant reservations.
/// Provides endpoints for creating, retrieving, updating,
/// cancelling reservations and starting food payments.
/// </summary>

using Microsoft.AspNetCore.Mvc;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.DTOs.Responses;
using Reservations.Application.Interfaces;

namespace Reservations.API.Controllers;

[ApiController]
[Route("api/reservations")]
public class ReservationsController : ControllerBase
{
    private static readonly Guid DevelopmentUserId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private readonly IReservationService _reservationService;

    public ReservationsController(
        IReservationService reservationService)
    {
        _reservationService = reservationService;
    }


    /// <summary>
    /// Creates a new restaurant reservation.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ReservationResponse>>
        CreateReservation(
            [FromBody] CreateReservationRequest request)
    {
        var userId = GetCurrentUserId();

        var result =
            await _reservationService.CreateReservationAsync(
                userId,
                request);

        return CreatedAtAction(
            nameof(GetReservation),
            new { id = result.Id },
            result);
    }


    /// <summary>
    /// Returns a reservation owned by the current user.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReservationResponse>>
        GetReservation(
            Guid id)
    {
        var userId = GetCurrentUserId();

        var result =
            await _reservationService.GetReservationByIdAsync(
                id,
                userId);

        return Ok(result);
    }


    /// <summary>
    /// Returns reservations owned by the current user.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetUserReservations(
        [FromQuery] ReservationQueryRequest request)
    {
        var userId = GetCurrentUserId();

        var result =
            await _reservationService.GetUserReservationsAsync(
                userId,
                request);

        return Ok(result);
    }


    /// <summary>
    /// Updates reservation details.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ReservationResponse>>
        UpdateReservation(
            Guid id,
            [FromBody] UpdateReservationRequest request)
    {
        var userId = GetCurrentUserId();

        var result =
            await _reservationService.UpdateReservationAsync(
                id,
                userId,
                request);

        return Ok(result);
    }


    /// <summary>
    /// Replaces the current food preorder for the reservation.
    /// This operation does not start payment.
    /// </summary>
    [HttpPut("{id:guid}/orders")]
    public async Task<ActionResult<ReservationResponse>>
        UpdateOrders(
            Guid id,
            [FromBody] UpdateReservationOrdersRequest request)
    {
        var userId = GetCurrentUserId();

        var result =
            await _reservationService.UpdateOrdersAsync(
                id,
                userId,
                request);

        return Ok(result);
    }


    /// <summary>
    /// Starts or retries payment for the reservation food preorder.
    /// </summary>
    [HttpPost("{id:guid}/payment")]
    public async Task<ActionResult<StartPaymentResponse>>
        StartPayment(
            Guid id)
    {
        var userId = GetCurrentUserId();

        var result =
            await _reservationService.StartPaymentAsync(
                id,
                userId);

        return Ok(result);
    }


    /// <summary>
    /// Cancels a reservation.
    /// If food has already been paid, refund processing is started.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> CancelReservation(
        Guid id)
    {
        var userId = GetCurrentUserId();

        await _reservationService.CancelReservationAsync(
            id,
            userId);

        return NoContent();
    }


    /// <summary>
    /// Returns the currently authenticated user ID.
    ///
    /// Development implementation only.
    /// This will later be replaced with the authenticated user's
    /// ID from JWT claims.
    /// </summary>
    private Guid GetCurrentUserId()
    {
        return DevelopmentUserId;
    }
}