using Microsoft.AspNetCore.Mvc;
using Notifications.API.DTOs;
using Notifications.API.Services.Interfaces;

namespace Notifications.API.Controllers;

[ApiController]
[Route("api/email")]
public class EmailTestController : ControllerBase
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;
    private readonly IWebHostEnvironment _env;

    public EmailTestController(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer,
        IWebHostEnvironment env)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
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

        var html = await _templateRenderer.RenderAsync(
            "confirm-email",
            new { ConfirmUrl = "http://localhost:3000/confirm-email?userId=demo&token=sample-token" },
            cancellationToken);

        await _emailSender.SendAsync(to, "Confirm your email", html, cancellationToken);

        return Ok(new { message = "Test email sent.", to, template = "confirm-email" });
    }
}
