using Microsoft.AspNetCore.Mvc;
using Payment.API.Handler;
using Stripe;
using System.Diagnostics;

namespace Payment.API.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    public class PaymentWebhookController : ControllerBase
    {
        private PaymentsHandler _paymentHandler;
        private readonly string _webhookSecret;
        public PaymentWebhookController(PaymentsHandler paymentHandler, IConfiguration configuration)
        {
            _paymentHandler = paymentHandler;
            _webhookSecret = configuration["Stripe:WebhookSecret"];
        }

        [HttpPost]
        [Route("StripeWebhook")]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();

            var signature = Request.Headers["Stripe-Signature"].ToString();

            Event stripeEvent;

            try
            {
                stripeEvent = EventUtility.ConstructEvent(json, signature, _webhookSecret);
            }
            catch (StripeException)
            {
                return BadRequest();
            }

            try
            {
                await _paymentHandler.HandleWebhookAsync(stripeEvent);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"Stripe error: {ex.Message}");
                // TODO LOG
                return StatusCode(500, "An error occurred while handling the webhook");
            }
            return Ok();
        }
    }
}
