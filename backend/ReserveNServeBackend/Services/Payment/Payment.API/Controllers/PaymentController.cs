using Microsoft.AspNetCore.Mvc;
using Payment.API.DTO;
using Stripe;
using System.Diagnostics;

namespace Payment.API.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class PaymentController : ControllerBase
    {
        [HttpPost]
        [Route("CreatePaymentIntent")]
        public async Task<IActionResult> CreatePaymentIntent(ProcessPaymentRequest request)
        {

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

            var service = new PaymentIntentService();
            var paymentIntent = await service.CreateAsync(options);

            return Ok(new
            {
                clientSecret = paymentIntent.ClientSecret
            });
        }
    }
}
