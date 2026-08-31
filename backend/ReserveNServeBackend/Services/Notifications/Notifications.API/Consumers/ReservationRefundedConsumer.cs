using MassTransit;
using Notifications.API.Services;
using Notifications.API.Services.Interfaces;
using ReserveNServe.Contracts;

namespace Notifications.API.Consumers;

public class ReservationRefundedConsumer : IConsumer<ReservationRefunded>
{
    private readonly IEmailDispatcher _dispatcher;

    public ReservationRefundedConsumer(IEmailDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    public async Task Consume(ConsumeContext<ReservationRefunded> context)
    {
        var message = context.Message;

        await _dispatcher.DispatchAsync(
            message.Email,
            "Refund completed",
            "reservation-refunded",
            message,
            context.CancellationToken);
    }
}