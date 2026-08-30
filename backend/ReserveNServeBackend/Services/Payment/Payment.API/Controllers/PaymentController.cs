using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Payment.API.DTO;
using Payment.API.Handler;
using Payment.API.Services;
using Stripe;
using System.Diagnostics;

namespace Payment.API.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentsHandler _paymentHandler;
        private readonly IStripePaymentService _stripePaymentService;

        public PaymentController(PaymentsHandler paymentHandler, IStripePaymentService stripePaymentService)
        {
            _paymentHandler = paymentHandler;
            _stripePaymentService = stripePaymentService;
        }

        [HttpPost]
        [Authorize]
        [Route("CreatePaymentIntent")]
        public async Task<IActionResult> CreatePaymentIntent(CreatePaymentIntentRequest request)
        {
            if (!_paymentHandler.IsReservationIdValid(request.ReservationId))
            {
                return BadRequest("Invalid reservation ID. Reservation ID must be a non-empty string.");
            }

            if (!_paymentHandler.IsAmountValid(request.Amount))
            {
                return BadRequest("Invalid amount. Amount must be greater than zero.");
            }

            Entities.Payment existingPayment = await _paymentHandler.GetPaymentByReservationIdAsync(request.ReservationId);

            if (existingPayment != null)
            {
                var paymentIntent = await _stripePaymentService.GetPaymentIntentAsync(existingPayment.payment_intent);

                return Ok(new
                {
                    clientSecret = paymentIntent.ClientSecret,
                    status = existingPayment.status
                });
            }

            var options = new PaymentIntentCreateOptions
            {
                Amount = (long)Math.Round(request.Amount * 100, MidpointRounding.AwayFromZero),
                Currency = request.Currency,
                Metadata = new Dictionary<string, string>
                {
                    { "reservationId", request.ReservationId }
                },
                AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
                {
                    Enabled = true,
                    AllowRedirects = "never"
                }
            };

            try
            {
                var paymentIntent = await _stripePaymentService.CreatePaymentIntentAsync(options);

                var payment = new Entities.Payment
                {
                    reservation_id = request.ReservationId,
                    payment_intent = paymentIntent.Id,
                    status = (int)Enums.PaymentStatus.PaymentPending
                };

                _paymentHandler.InsertNewPaymentAsync(payment);

                return Ok(new
                {
                    clientSecret = paymentIntent.ClientSecret,
                    status = payment.status
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
        [Authorize]
        [Route("Refund")]
        public async Task<IActionResult> Refund(RefundRequest request)
        {
            var payment = await _paymentHandler.GetPaymentByReservationIdAsync(request.ReservationId);

            if (payment == null)
            {
                return StatusCode(404, "Payment not found for the given reservation ID.");
            }

            var options = new RefundCreateOptions
            {
                PaymentIntent = payment.payment_intent
            };

            try
            {
                _stripePaymentService.CreateRefund(options);
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
