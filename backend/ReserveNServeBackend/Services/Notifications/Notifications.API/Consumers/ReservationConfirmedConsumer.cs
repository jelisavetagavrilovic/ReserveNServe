using MassTransit;
using Notifications.API.Services.Interfaces;
using ReserveNServe.Contracts;

namespace Notifications.API.Consumers;

public class ReservationConfirmedConsumer : IConsumer<ReservationConfirmed>
{
    private readonly IEmailDispatcher _dispatcher;

    public ReservationConfirmedConsumer(IEmailDispatcher dispatcher)
    {
        _dispatcher = dispatcher;
    }

    public async Task Consume(ConsumeContext<ReservationConfirmed> context)
    {
        var message = context.Message;

        await _dispatcher.DispatchAsync(
            message.Email,
            "Reservation confirmed",
            "reservation-confirmed",
            message,
            context.CancellationToken);
    }
}