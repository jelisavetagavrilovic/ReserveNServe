using MassTransit;
using Notifications.API.Services;
using Notifications.API.Services.Interfaces;
using ReserveNServe.Contracts;

namespace Notifications.API.Consumers;

public class ReservationCancelledConsumer : IConsumer<ReservationCancelled>
{
    private readonly IEmailDispatcher _dispatcher;

    public ReservationCancelledConsumer(IEmailDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    public async Task Consume(ConsumeContext<ReservationCancelled> context)
    {
        var message = context.Message;

        await _dispatcher.DispatchAsync(
            message.Email,
            "Reservation cancelled",
            "reservation-cancelled",
            message,
            context.CancellationToken);
    }
}