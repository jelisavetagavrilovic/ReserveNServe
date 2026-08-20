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
    private readonly IEmailDispatcher _dispatcher;
    private readonly NotificationsDbContext _db;
    private readonly IWebHostEnvironment _env;

    public EmailTestController(
        IEmailDispatcher dispatcher,
        NotificationsDbContext db,
        IWebHostEnvironment env)
    {
        _dispatcher = dispatcher;
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

        var message = await _dispatcher.DispatchAsync(
            to,
            "Confirm your email",
            "confirm-email",
            new { ConfirmUrl = "http://localhost:3000/confirm-email?userId=demo&token=sample-token" },
            cancellationToken);

        return Ok(new
        {
            message = message.Status == EmailStatus.Sent ? "Test email sent." : "Test email failed.",
            id = message.Id,
            to,
            template = message.TemplateName,
            status = message.Status.ToString()
        });
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
