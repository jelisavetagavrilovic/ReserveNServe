using MassTransit;
using Notifications.API.Services.Interfaces;
using ReserveNServe.Contracts;

namespace Notifications.API.Consumers;

public class UserRegisteredConsumer : IConsumer<UserRegistered>
{
    private readonly IEmailDispatcher _dispatcher;
    private readonly IConfiguration _configuration;

    public UserRegisteredConsumer(IEmailDispatcher dispatcher, IConfiguration configuration)
    {
        _dispatcher = dispatcher;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<UserRegistered> context)
    {
        var message = context.Message;
        var baseUrl = _configuration["FrontendBaseUrl"] ?? "http://localhost:3000";
        var confirmUrl =
            $"{baseUrl}/confirm-email?userId={Uri.EscapeDataString(message.UserId)}&token={Uri.EscapeDataString(message.ConfirmationToken)}";

        await _dispatcher.DispatchAsync(
            message.Email,
            "Confirm your email",
            "confirm-email",
            new { ConfirmUrl = confirmUrl },
            context.CancellationToken);
    }
}
