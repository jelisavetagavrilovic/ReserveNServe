using Microsoft.AspNetCore.Mvc;
using Notifications.API.DTOs;
using Notifications.API.Services.Interfaces;

namespace Notifications.API.Controllers;

[ApiController]
[Route("api/email")]
public class EmailTestController : ControllerBase
{
    private readonly IEmailSender _emailSender;
    private readonly IWebHostEnvironment _env;

    public EmailTestController(IEmailSender emailSender, IWebHostEnvironment env)
    {
        _emailSender = emailSender;
        _env = env;
    }

    // Dev-only helper to verify the email pipeline end-to-end (e.g. against MailHog).
    [HttpPost("test")]
    public async Task<IActionResult> SendTest(SendTestEmailRequest request, CancellationToken cancellationToken)
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var to = string.IsNullOrWhiteSpace(request.To) ? "test@reservenserve.local" : request.To;

        await _emailSender.SendAsync(
            to,
            "ReserveNServe test email",
            "<h1>It works!</h1><p>This is a test email sent through IEmailSender via MailHog.</p>",
            cancellationToken);

        return Ok(new { message = "Test email sent.", to });
    }
}
