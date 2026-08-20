using Notifications.API.Data;

namespace Notifications.API.Services.Interfaces;

public interface IEmailDispatcher
{
    /// <summary>
    /// Renders the template, sends the email and persists an <see cref="EmailMessage"/> log entry.
    /// Failures are captured on the log entry (status Failed) rather than thrown.
    /// </summary>
    Task<EmailMessage> DispatchAsync(
        string toEmail,
        string subject,
        string templateName,
        object model,
        CancellationToken cancellationToken = default);
}
