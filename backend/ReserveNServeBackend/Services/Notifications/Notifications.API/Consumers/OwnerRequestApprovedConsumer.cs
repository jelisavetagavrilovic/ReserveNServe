using MassTransit;
using Notifications.API.Services.Interfaces;
using ReserveNServe.Contracts;

namespace Notifications.API.Consumers;

public class OwnerRequestApprovedConsumer : IConsumer<OwnerRequestApproved>
{
    private readonly IEmailDispatcher _dispatcher;
    private readonly IConfiguration _configuration;

    public OwnerRequestApprovedConsumer(IEmailDispatcher dispatcher, IConfiguration configuration)
    {
        _dispatcher = dispatcher;
        _configuration = configuration;
    }

    public async Task Consume(ConsumeContext<OwnerRequestApproved> context)
    {
        var message = context.Message;
        var baseUrl = _configuration["FrontendBaseUrl"] ?? "http://localhost:3000";

        await _dispatcher.DispatchAsync(
            message.Email,
            "Your restaurant owner request",
            "owner-approved",
            new
            {
                Approved = message.Approved,
                Reason = message.Reason,
                LoginUrl = $"{baseUrl}/login"
            },
            context.CancellationToken);
    }
}
