using System.Text;
using System.Text.Json;
using Payment.API.Enums;
using RabbitMQ.Client;

namespace Payment.API.Messaging;

public class RabbitMqPaymentStatusPublisher : IPaymentStatusPublisher
{
    private const string ExchangeName = "payment.events";
    private const string RoutingKey = "payment.status.changed";

    private readonly IConfiguration _configuration;

    public RabbitMqPaymentStatusPublisher(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task PublishAsync(string reservationId, PaymentStatus status, string? receiptUrl = null)
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMq:Host"] ?? "rabbitmq",
            UserName = _configuration["RabbitMq:Username"] ?? "guest",
            Password = _configuration["RabbitMq:Password"] ?? "guest"
        };

        await using var connection = await factory.CreateConnectionAsync();
        await using var channel = await connection.CreateChannelAsync();

        await channel.ExchangeDeclareAsync(
            exchange: ExchangeName,
            type: ExchangeType.Topic,
            durable: true,
            autoDelete: false);
        
        var message = new
        {
            reservationId,
            status = status.ToString(),
            receiptUrl
        };

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));

        var properties = new BasicProperties
        {
            Persistent = true,
            ContentType = "application/json"
        };

        await channel.BasicPublishAsync(
            exchange: ExchangeName,
            routingKey: RoutingKey,
            mandatory: false,
            basicProperties: properties,
            body: body);
    }
}

public record PaymentStatusChangedEvent(
    string ReservationId,
    string Status,
    string? ReceiptUrl = null);