using MassTransit;
using Microsoft.Extensions.Configuration;
using Moq;
using Notifications.API.Consumers;
using Notifications.API.Data;
using Notifications.API.Services.Interfaces;
using ReserveNServe.Contracts;
using Xunit;

namespace Notifications.API.Tests;

public class NotificationConsumerTests
{
    private const string TestEmail = "test@test";
    private const string FrontendUrl = "http://localhost:3000";

    private static IConfiguration CreateConfiguration()
        => new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FrontendBaseUrl"] = FrontendUrl
            })
            .Build();

    private static Mock<IEmailDispatcher> CreateDispatcher()
    {
        var dispatcher = new Mock<IEmailDispatcher>();

        dispatcher
            .Setup(x => x.DispatchAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<object>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EmailMessage());

        return dispatcher;
    }

    private static Mock<ConsumeContext<T>> CreateContext<T>(T message) where T : class
    {
        var context = new Mock<ConsumeContext<T>>();
        context.SetupGet(x => x.Message).Returns(message);
        context.SetupGet(x => x.CancellationToken).Returns(CancellationToken.None);
        return context;
    }

    private static string? GetProperty(object model, string propertyName)
        => model.GetType().GetProperty(propertyName)?.GetValue(model)?.ToString();

    [Fact]
    public async Task UserRegisteredConsumer_ShouldDispatchConfirmationEmail()
    {
        var dispatcher = CreateDispatcher();
        var consumer = new UserRegisteredConsumer(dispatcher.Object, CreateConfiguration());
        var message = new UserRegistered("user/1", TestEmail, "token+123/=");
        var context = CreateContext(message);

        await consumer.Consume(context.Object);

        dispatcher.Verify(x => x.DispatchAsync(
            TestEmail,
            "Confirm your email",
            "confirm-email",
            It.Is<object>(model =>
                GetProperty(model, "ConfirmUrl") ==
                $"{FrontendUrl}/confirm-email?userId=user%2F1&token=token%2B123%2F%3D"),
            CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task PasswordResetRequestedConsumer_ShouldDispatchResetEmail()
    {
        var dispatcher = CreateDispatcher();
        var consumer = new PasswordResetRequestedConsumer(dispatcher.Object, CreateConfiguration());
        var message = new PasswordResetRequested("user/1", TestEmail, "token+123/=");
        var context = CreateContext(message);

        await consumer.Consume(context.Object);

        dispatcher.Verify(x => x.DispatchAsync(
            TestEmail,
            "Reset your password",
            "reset-password",
            It.Is<object>(model =>
                GetProperty(model, "ResetUrl") ==
                $"{FrontendUrl}/reset-password?userId=user%2F1&token=token%2B123%2F%3D"),
            CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task OwnerRequestApprovedConsumer_ShouldDispatchOwnerEmail()
    {
        var dispatcher = CreateDispatcher();
        var consumer = new OwnerRequestApprovedConsumer(dispatcher.Object, CreateConfiguration());
        var message = new OwnerRequestApproved(TestEmail, true, null);
        var context = CreateContext(message);

        await consumer.Consume(context.Object);

        dispatcher.Verify(x => x.DispatchAsync(
            TestEmail,
            "Your restaurant owner request",
            "owner-approved",
            It.Is<object>(model =>
                GetProperty(model, "Approved") == "True" &&
                GetProperty(model, "LoginUrl") == $"{FrontendUrl}/login"),
            CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task ReservationConfirmedConsumer_ShouldDispatchConfirmationEmail()
    {
        var dispatcher = CreateDispatcher();
        var consumer = new ReservationConfirmedConsumer(dispatcher.Object);

        var message = new ReservationConfirmed(
            Guid.NewGuid(),
            TestEmail,
            "Test Restaurant",
            "Test Address",
            "Belgrade",
            new DateOnly(2030, 9, 1),
            new TimeOnly(19, 0),
            2,
            "Terrace",
            "19:30",
            2400m,
            new List<ReservationOrderItem>
            {
                new("Pizza", 1200m, 2, 2400m)
            },
            "https://receipt.test");

        var context = CreateContext(message);

        await consumer.Consume(context.Object);

        dispatcher.Verify(x => x.DispatchAsync(
            TestEmail,
            "Reservation confirmed",
            "reservation-confirmed",
            message,
            CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task ReservationCancelledConsumer_ShouldDispatchCancellationEmail()
    {
        var dispatcher = CreateDispatcher();
        var consumer = new ReservationCancelledConsumer(dispatcher.Object);

        var message = new ReservationCancelled(
            Guid.NewGuid(),
            TestEmail,
            "Test Restaurant",
            "Test Address",
            "Belgrade",
            new DateOnly(2030, 9, 1),
            new TimeOnly(19, 0),
            2,
            "Terrace",
            true,
            2400m);

        var context = CreateContext(message);

        await consumer.Consume(context.Object);

        dispatcher.Verify(x => x.DispatchAsync(
            TestEmail,
            "Reservation cancelled",
            "reservation-cancelled",
            message,
            CancellationToken.None), Times.Once);
    }

    [Fact]
    public async Task ReservationRefundedConsumer_ShouldDispatchRefundEmail()
    {
        var dispatcher = CreateDispatcher();
        var consumer = new ReservationRefundedConsumer(dispatcher.Object);

        var message = new ReservationRefunded(
            Guid.NewGuid(),
            TestEmail,
            "Test Restaurant",
            "Test Address",
            "Belgrade",
            new DateOnly(2030, 9, 1),
            new TimeOnly(19, 0),
            2400m,
            "https://receipt.test");

        var context = CreateContext(message);

        await consumer.Consume(context.Object);

        dispatcher.Verify(x => x.DispatchAsync(
            TestEmail,
            "Refund completed",
            "reservation-refunded",
            message,
            CancellationToken.None), Times.Once);
    }
}