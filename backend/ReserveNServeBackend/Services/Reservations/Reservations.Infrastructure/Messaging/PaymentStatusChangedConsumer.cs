using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.Interfaces;

namespace Reservations.Infrastructure.Messaging;

public class PaymentStatusChangedConsumer : BackgroundService
{
    private const string ExchangeName = "payment.events";
    private const string QueueName = "reservations.payment-status";
    private const string RoutingKey = "payment.status.changed";

    private readonly IConfiguration _configuration;
    private readonly IServiceScopeFactory _scopeFactory;

    private IConnection? _connection;
    private IChannel? _channel;

    public PaymentStatusChangedConsumer(
        IConfiguration configuration,
        IServiceScopeFactory scopeFactory)
    {
        _configuration = configuration;
        _scopeFactory = scopeFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMq:Host"] ?? "rabbitmq",
            UserName = _configuration["RabbitMq:Username"] ?? "guest",
            Password = _configuration["RabbitMq:Password"] ?? "guest"
        };

        _connection = await factory.CreateConnectionAsync(stoppingToken);
        _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await _channel.ExchangeDeclareAsync(
            exchange: ExchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false,
            cancellationToken: stoppingToken);

        await _channel.QueueDeclareAsync(
            queue: QueueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            cancellationToken: stoppingToken);

        await _channel.QueueBindAsync(
            queue: QueueName,
            exchange: ExchangeName,
            routingKey: RoutingKey,
            cancellationToken: stoppingToken);

        await _channel.BasicQosAsync(
            prefetchSize: 0,
            prefetchCount: 1,
            global: false,
            cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(_channel);

        consumer.ReceivedAsync += async (_, ea) =>
        {
            try
            {
                var json = Encoding.UTF8.GetString(ea.Body.Span);

                var message = JsonSerializer.Deserialize<PaymentStatusChangedEvent>(
                    json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (message == null || !Guid.TryParse(message.ReservationId, out var reservationId))
                {
                    await _channel.BasicNackAsync(ea.DeliveryTag, false, false);
                    return;
                }

                var status = MapStatus(message.Status);

                using var scope = _scopeFactory.CreateScope();
                var reservationService = scope.ServiceProvider.GetRequiredService<IReservationService>();

                await reservationService.HandlePaymentStatusUpdateAsync(
                    new PaymentStatusUpdateRequest
                    {
                        ReservationId = reservationId,
                        Status = status
                    });

                await _channel.BasicAckAsync(ea.DeliveryTag, false);
            }
            catch (ArgumentException)
            {
                await _channel.BasicNackAsync(ea.DeliveryTag, false, false);
            }
            catch
            {
                await _channel.BasicNackAsync(ea.DeliveryTag, false, true);
            }
        };

        await _channel.BasicConsumeAsync(
            queue: QueueName,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private static PaymentStatus MapStatus(string status)
    {
        return status switch
        {
            "PaymentPending" => PaymentStatus.PaymentPending,
            "PaymentSucceeded" => PaymentStatus.PaymentSucceeded,
            "PaymentFailed" => PaymentStatus.PaymentFailed,
            "RefundPending" => PaymentStatus.RefundPending,
            "RefundSucceeded" => PaymentStatus.RefundSucceeded,
            "RefundFailed" => PaymentStatus.RefundFailed,
            _ => throw new ArgumentException($"Unknown payment status: {status}")
        };
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel != null) await _channel.DisposeAsync();
        if (_connection != null) await _connection.DisposeAsync();

        await base.StopAsync(cancellationToken);
    }
}