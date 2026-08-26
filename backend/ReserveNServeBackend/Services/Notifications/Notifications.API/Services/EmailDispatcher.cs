using Notifications.API.Data;
using Notifications.API.Services.Interfaces;

namespace Notifications.API.Services;

public class EmailDispatcher : IEmailDispatcher
{
    private readonly IEmailSender _emailSender;
    private readonly IEmailTemplateRenderer _renderer;
    private readonly NotificationsDbContext _db;
    private readonly ILogger<EmailDispatcher> _logger;

    public EmailDispatcher(
        IEmailSender emailSender,
        IEmailTemplateRenderer renderer,
        NotificationsDbContext db,
        ILogger<EmailDispatcher> logger)
    {
        _emailSender = emailSender;
        _renderer = renderer;
        _db = db;
        _logger = logger;
    }

    public async Task<EmailMessage> DispatchAsync(
        string toEmail,
        string subject,
        string templateName,
        object model,
        CancellationToken cancellationToken = default)
    {
        var message = new EmailMessage
        {
            Id = Guid.NewGuid(),
            ToEmail = toEmail,
            Subject = subject,
            TemplateName = templateName,
            Status = EmailStatus.Pending,
            Attempts = 1,
            CreatedAtUtc = DateTime.UtcNow
        };
        _db.EmailMessages.Add(message);
        await _db.SaveChangesAsync(cancellationToken);

        try
        {
            var html = await _renderer.RenderAsync(templateName, model, cancellationToken);
            await _emailSender.SendAsync(toEmail, subject, html, cancellationToken);

            message.Status = EmailStatus.Sent;
            message.SentAtUtc = DateTime.UtcNow;
        }
        catch (Exception ex)
        {
            message.Status = EmailStatus.Failed;
            message.Error = ex.Message;
            _logger.LogError(ex, "Failed to send {Template} email to {Recipient}.", templateName, toEmail);
        }

        await _db.SaveChangesAsync(cancellationToken);
        return message;
    }
}
