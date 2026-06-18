namespace Notifications.API.Data;

public enum EmailStatus
{
    Pending,
    Sent,
    Failed
}

public class EmailMessage
{
    public Guid Id { get; set; }
    public string ToEmail { get; set; } = default!;
    public string Subject { get; set; } = default!;
    public string TemplateName { get; set; } = default!;
    public EmailStatus Status { get; set; } = EmailStatus.Pending;
    public int Attempts { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? SentAtUtc { get; set; }
}
