using Microsoft.AspNetCore.Mvc;
using Payment.API.Handler;
using Stripe;

namespace Payment.API.Controllers;

[ApiController]
[Route("/api/[controller]")]
public class PaymentWebhookController : ControllerBase
{
    private readonly PaymentsHandler _paymentHandler;
    private readonly ILogger<PaymentWebhookController> _logger;
    private readonly string _webhookSecret;

    public PaymentWebhookController(PaymentsHandler paymentHandler, ILogger<PaymentWebhookController> logger)
    {
        _paymentHandler = paymentHandler;
        _logger = logger;
        _webhookSecret = Environment.GetEnvironmentVariable("PAYMENT_STRIPE_WEBHOOK_SECRET")
                         ?? throw new InvalidOperationException("PAYMENT_STRIPE_WEBHOOK_SECRET is not configured.");
    }

    [HttpPost("StripeWebhook")]
    public async Task<IActionResult> StripeWebhook()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();

        _logger.LogInformation("Stripe webhook received.");

        Event stripeEvent;

        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, signature, _webhookSecret);
            _logger.LogInformation("Stripe event verified: {EventType}, Id: {EventId}", stripeEvent.Type, stripeEvent.Id);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Stripe webhook signature verification failed.");
            return BadRequest();
        }

        try
        {
            await _paymentHandler.HandleWebhookAsync(stripeEvent);
            _logger.LogInformation("Stripe event handled successfully: {EventType}", stripeEvent.Type);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling Stripe event {EventType}", stripeEvent.Type);
            return StatusCode(500, "An error occurred while handling the webhook.");
        }
    }
}