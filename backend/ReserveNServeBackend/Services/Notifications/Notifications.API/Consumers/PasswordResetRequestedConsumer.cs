using MassTransit;
using Notifications.API.Services.Interfaces;
using ReserveNServe.Contracts;

namespace Notifications.API.Consumers;

public class PasswordResetRequestedConsumer : IConsumer<PasswordResetRequested>
{
    private readonly IEmailDispatcher _dispatcher;
    private readonly IConfiguration _configuration;

    public PasswordResetRequestedConsumer(IEmailDispatcher dispatcher, IConfiguration configuration)
    {
        _dispatcher = dispatcher;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<PasswordResetRequested> context)
    {
        var message = context.Message;
        var baseUrl = _configuration["FrontendBaseUrl"] ?? "http://localhost:3000";
        var resetUrl =
            $"{baseUrl}/reset-password?userId={Uri.EscapeDataString(message.UserId)}&token={Uri.EscapeDataString(message.ResetToken)}";

        await _dispatcher.DispatchAsync(
            message.Email,
            "Reset your password",
            "reset-password",
            new { ResetUrl = resetUrl },
            context.CancellationToken);
    }
}
