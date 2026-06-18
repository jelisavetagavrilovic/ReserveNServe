using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Notifications.API.Data;
using Notifications.API.DTOs;
using Notifications.API.Services.Interfaces;

namespace Notifications.API.Controllers;

[ApiController]
[Route("api/email")]
public class EmailTestController : ControllerBase
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _templateRenderer;
    private readonly NotificationsDbContext _db;
    private readonly IWebHostEnvironment _env;

    public EmailTestController(
        IEmailSender emailSender,
        IEmailTemplateRenderer templateRenderer,
        NotificationsDbContext db,
        IWebHostEnvironment env)
    {
        _emailSender = emailSender;
        _templateRenderer = templateRenderer;
        _db = db;
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

        var message = new EmailMessage
        {
            Id = Guid.NewGuid(),
            ToEmail = to,
            Subject = "Confirm your email",
            TemplateName = "confirm-email",
            Status = EmailStatus.Pending,
            Attempts = 1,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.EmailMessages.Add(message);
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            var html = await _templateRenderer.RenderAsync(
                message.TemplateName,
                new { ConfirmUrl = "http://localhost:3000/confirm-email?userId=demo&token=sample-token" },
                cancellationToken);

            await _emailSender.SendAsync(to, message.Subject, html, cancellationToken);

            message.Status = EmailStatus.Sent;
            message.SentAtUtc = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);

            return Ok(new { message = "Test email sent.", id = message.Id, to, template = message.TemplateName });
        }
        catch (Exception ex)
        {
            message.Status = EmailStatus.Failed;
            message.Error = ex.Message;
            await _db.SaveChangesAsync(cancellationToken);

            return StatusCode(500, new { message = "Failed to send test email.", id = message.Id, error = ex.Message });
        }
    }

    // Dev-only helper to view the most recent email log entries.
    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(CancellationToken cancellationToken)
    {
        if (!_env.IsDevelopment())
        {
            return NotFound();
        }

        var logs = await _db.EmailMessages
            .OrderByDescending(m => m.CreatedAtUtc)
            .Take(20)
            .Select(m => new
            {
                m.Id,
                m.ToEmail,
                m.Subject,
                m.TemplateName,
                Status = m.Status.ToString(),
                m.Attempts,
                m.Error,
                m.CreatedAtUtc,
                m.SentAtUtc
            })
            .ToListAsync(cancellationToken);

        return Ok(logs);
    }
}
