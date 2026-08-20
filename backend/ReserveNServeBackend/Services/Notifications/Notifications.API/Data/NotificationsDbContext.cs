using Microsoft.EntityFrameworkCore;

namespace Notifications.API.Data;

public class NotificationsDbContext : DbContext
{
    public NotificationsDbContext(DbContextOptions<NotificationsDbContext> options) : base(options)
    {
    }

    public DbSet<EmailMessage> EmailMessages => Set<EmailMessage>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<EmailMessage>(b =>
        {
            b.HasKey(x => x.Id);
            b.Property(x => x.ToEmail).IsRequired().HasMaxLength(256);
            b.Property(x => x.Subject).IsRequired().HasMaxLength(256);
            b.Property(x => x.TemplateName).IsRequired().HasMaxLength(128);
            b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
            b.HasIndex(x => x.CreatedAtUtc);
        });
    }
}
