using Microsoft.AspNetCore.Mvc;
using Payment.API.DTO;
using Payment.API.Handler;
using Stripe;
using System.Diagnostics;

namespace Payment.API.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private PaymentsHandler _paymentHandler;
        public PaymentController(PaymentsHandler paymentHandler)
        {
            _paymentHandler = paymentHandler;
        }

        [HttpPost]
        [Route("CreatePaymentIntent")]
        public async Task<IActionResult> CreatePaymentIntent(CreatePaymentIntentRequest request)
        {
            if(!_paymentHandler.IsReservationIdValid(request.ReservationId))
            {
                return BadRequest("Invalid reservation ID. Reservation ID must be a non-empty string.");
            }
            if(!_paymentHandler.IsAmountValid(request.Amount))
            {
                return BadRequest("Invalid amount. Amount must be greater than zero.");
            }

            var options = new PaymentIntentCreateOptions
            {
                Amount = request.Amount,
                Currency = request.Currency,
                Metadata = new Dictionary<string, string> { { "reservationId", request.ReservationId } },
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never"
                }
            };

            try
            {
                var service = new PaymentIntentService();
                var paymentIntent = await service.CreateAsync(options);

                Entities.Payment payment = new Entities.Payment
                {
                    reservation_id = request.ReservationId,
                    charge_id = paymentIntent.Id,
                };

                _paymentHandler.InsertNewPaymentAsync(payment);

                return Ok(new
                {
                    clientSecret = paymentIntent.ClientSecret
                });
            }
            catch (StripeException ex)
            {
                Debug.WriteLine($"Stripe error: {ex.Message}");
                return StatusCode(500, "An error occurred while creating the payment intent.");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Unexpected error: {ex.Message}");
                return StatusCode(500, "An unexpected error occurred.");
            }
        }

        [HttpPost]
        [Route("Refund")]
        public async Task<IActionResult> Refund(RefundRequest request)
        {
            var payment = await _paymentHandler.GetPaymentByReservationIdAsync(request.ReservationId);
            if(payment == null)
            {
                return StatusCode(404, "Payment not found for the given reservation ID.");
            }

            var refundService = new RefundService();
            var options = new RefundCreateOptions
            {
                Charge = payment.charge_id,
            };

            try
            {
                Refund refund = refundService.Create(options);
            }
            catch (StripeException ex)
            {
                Debug.WriteLine($"Stripe error: {ex.Message}");
                return StatusCode(500, "An error occurred while processing the refund.");
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Unexpected error: {ex.Message}");
                return StatusCode(500, "An unexpected error occurred.");
            }

            return StatusCode(200, "Refund processed successfully.");
        }
    }
}
