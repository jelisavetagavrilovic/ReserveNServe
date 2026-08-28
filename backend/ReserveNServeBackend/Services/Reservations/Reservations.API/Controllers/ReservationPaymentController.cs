/// <summary>
/// Internal API controller used for receiving payment status updates
/// from the Payment service.
/// </summary>

using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.Interfaces;

namespace Reservations.API.Controllers;

[ApiController]
[Route("api/internal/reservations")]
public class ReservationPaymentController : ControllerBase
{
    private readonly IReservationService _reservationService;

    public ReservationPaymentController(
        IReservationService reservationService)
    {
        _reservationService = reservationService;
    }


    /// <summary>
    /// Receives payment and refund status updates
    /// from the Payment service.
    /// </summary>
    [HttpPost("payment-status")]
    public async Task<IActionResult> UpdatePaymentStatus(
        [FromBody] PaymentStatusUpdateRequest request)
    {
        await _reservationService
            .HandlePaymentStatusUpdateAsync(request);

        return NoContent();
    }
}