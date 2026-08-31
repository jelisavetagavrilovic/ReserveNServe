using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Payment.API.Controllers;
using Payment.API.Enums;
using Payment.API.Handler;
using Payment.API.Messaging;
using Payment.API.Repositories;
using Stripe;
using PaymentEntity = Payment.API.Entities.Payment;

namespace Payment.API.Tests;

[CollectionDefinition(
    "PaymentWebhookController environment-variable tests",
    DisableParallelization = true)]
public sealed class PaymentWebhookControllerCollection
{
    public const string CollectionName =
        "PaymentWebhookController environment-variable tests";
}

[Collection(PaymentWebhookControllerCollection.CollectionName)]
public class PaymentWebhookControllerTests : IDisposable
{
    private const string WebhookSecret =
        "whsec_unit_test_secret";

    private const string WebhookSecretVariable =
        "PAYMENT_STRIPE_WEBHOOK_SECRET";

    private readonly string? _previousWebhookSecret;

    private readonly Mock<IPaymentsRepository>
        _repositoryMock;

    private readonly Mock<IPaymentStatusPublisher>
        _publisherMock;

    private readonly Mock<ILogger<PaymentWebhookController>>
        _loggerMock;

    public PaymentWebhookControllerTests()
    {
        _previousWebhookSecret =
            Environment.GetEnvironmentVariable(
                WebhookSecretVariable);

        Environment.SetEnvironmentVariable(
            WebhookSecretVariable,
            WebhookSecret);

        _repositoryMock =
            new Mock<IPaymentsRepository>(
                MockBehavior.Strict);

        _publisherMock =
            new Mock<IPaymentStatusPublisher>(
                MockBehavior.Strict);

        _loggerMock =
            new Mock<ILogger<PaymentWebhookController>>();
    }

    [Fact]
    public void Constructor_Throws_WhenWebhookSecretIsNotConfigured()
    {
        Environment.SetEnvironmentVariable(
            WebhookSecretVariable,
            null);

        var handler = CreateHandler();

        var exception =
            Assert.Throws<InvalidOperationException>(
                () => new PaymentWebhookController(
                    handler,
                    _loggerMock.Object));

        Assert.Equal(
            "PAYMENT_STRIPE_WEBHOOK_SECRET is not configured.",
            exception.Message);
    }

    [Fact]
    public async Task StripeWebhook_ReturnsBadRequest_WhenSignatureHeaderIsMissing()
    {
        var payload =
            CreatePaymentIntentEventJson(
                EventTypes.PaymentIntentSucceeded,
                "evt_missing_signature",
                "pi_missing_signature");

        var controller =
            CreateController(
                payload,
                stripeSignature: null);

        var result =
            await controller.StripeWebhook();

        Assert.IsType<BadRequestResult>(result);

        _repositoryMock.VerifyNoOtherCalls();
        _publisherMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task StripeWebhook_ReturnsBadRequest_WhenSignatureIsInvalid()
    {
        var payload =
            CreatePaymentIntentEventJson(
                EventTypes.PaymentIntentSucceeded,
                "evt_invalid_signature",
                "pi_invalid_signature");

        var controller =
            CreateController(
                payload,
                "t=1234567890,v1=invalid-signature");

        var result =
            await controller.StripeWebhook();

        Assert.IsType<BadRequestResult>(result);

        _repositoryMock.VerifyNoOtherCalls();
        _publisherMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task StripeWebhook_ReturnsOk_AndHandlesPaymentSucceeded_WhenSignatureIsValid()
    {
        var payment = new PaymentEntity
        {
            id = 11,
            reservation_id = "reservation-123",
            payment_intent = "pi_succeeded",
            status = (int)PaymentStatus.PaymentPending
        };

        _repositoryMock
            .Setup(repository =>
                repository.GetPaymentByIntentIdAsync(
                    "pi_succeeded"))
            .ReturnsAsync(payment);

        _repositoryMock
            .Setup(repository =>
                repository.UpdatePaymentStatus(
                    payment.id,
                    (int)PaymentStatus.PaymentSucceeded))
            .Returns(Task.CompletedTask);

        _publisherMock
            .Setup(publisher =>
                publisher.PublishAsync(
                    "reservation-123",
                    PaymentStatus.PaymentSucceeded))
            .Returns(Task.CompletedTask);

        var payload =
            CreatePaymentIntentEventJson(
                EventTypes.PaymentIntentSucceeded,
                "evt_succeeded",
                "pi_succeeded");

        var signature =
            CreateSignature(payload);

        var controller =
            CreateController(
                payload,
                signature);

        var result =
            await controller.StripeWebhook();

        Assert.IsType<OkResult>(result);

        _repositoryMock.Verify(
            repository =>
                repository.GetPaymentByIntentIdAsync(
                    "pi_succeeded"),
            Times.Once);

        _repositoryMock.Verify(
            repository =>
                repository.UpdatePaymentStatus(
                    payment.id,
                    (int)PaymentStatus.PaymentSucceeded),
            Times.Once);

        _publisherMock.Verify(
            publisher =>
                publisher.PublishAsync(
                    "reservation-123",
                    PaymentStatus.PaymentSucceeded),
            Times.Once);

        _repositoryMock.VerifyNoOtherCalls();
        _publisherMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task StripeWebhook_ReturnsOk_AndDoesNothing_ForUnhandledValidEvent()
    {
        var payload =
            CreateEventJson(
                eventType: "customer.created",
                eventId: "evt_customer_created",
                dataObject: new
                {
                    id = "cus_123",
                    @object = "customer",
                    created =
                        DateTimeOffset.UtcNow
                            .ToUnixTimeSeconds(),
                    livemode = false,
                    metadata =
                        new Dictionary<string, string>()
                });

        var signature =
            CreateSignature(payload);

        var controller =
            CreateController(
                payload,
                signature);

        var result =
            await controller.StripeWebhook();

        Assert.IsType<OkResult>(result);

        _repositoryMock.VerifyNoOtherCalls();
        _publisherMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task StripeWebhook_Returns500_WhenHandlingVerifiedEventThrows()
    {
        _repositoryMock
            .Setup(repository =>
                repository.GetPaymentByIntentIdAsync(
                    "pi_database_error"))
            .ThrowsAsync(
                new InvalidOperationException(
                    "Database unavailable"));

        var payload =
            CreatePaymentIntentEventJson(
                EventTypes.PaymentIntentSucceeded,
                "evt_handler_error",
                "pi_database_error");

        var signature =
            CreateSignature(payload);

        var controller =
            CreateController(
                payload,
                signature);

        var result =
            await controller.StripeWebhook();

        var objectResult =
            Assert.IsType<ObjectResult>(result);

        Assert.Equal(
            StatusCodes.Status500InternalServerError,
            objectResult.StatusCode);

        Assert.Equal(
            "An error occurred while handling the webhook.",
            objectResult.Value);

        _repositoryMock.Verify(
            repository =>
                repository.GetPaymentByIntentIdAsync(
                    "pi_database_error"),
            Times.Once);

        _repositoryMock.VerifyNoOtherCalls();
        _publisherMock.VerifyNoOtherCalls();
    }

    public void Dispose()
    {
        Environment.SetEnvironmentVariable(
            WebhookSecretVariable,
            _previousWebhookSecret);
    }

    private PaymentsHandler CreateHandler()
    {
        return new PaymentsHandler(
            _repositoryMock.Object,
            _publisherMock.Object);
    }

    private PaymentWebhookController CreateController(
        string requestBody,
        string? stripeSignature)
    {
        var controller =
            new PaymentWebhookController(
                CreateHandler(),
                _loggerMock.Object);

        var httpContext =
            new DefaultHttpContext();

        httpContext.Request.Body =
            new MemoryStream(
                Encoding.UTF8.GetBytes(
                    requestBody));

        if (stripeSignature is not null)
        {
            httpContext
                .Request
                .Headers["Stripe-Signature"] =
                    stripeSignature;
        }

        controller.ControllerContext =
            new ControllerContext
            {
                HttpContext = httpContext
            };

        return controller;
    }

    private static string CreateSignature(
        string payload)
    {
        var timestamp =
            DateTimeOffset.UtcNow
                .ToUnixTimeSeconds();

        return EventUtility.GenerateSignatureHeader(
            payload,
            WebhookSecret,
            timestamp);
    }

    private static string CreatePaymentIntentEventJson(
        string eventType,
        string eventId,
        string paymentIntentId)
    {
        var paymentIntentStatus =
            eventType ==
            EventTypes.PaymentIntentSucceeded
                ? "succeeded"
                : "requires_payment_method";

        var amountReceived =
            paymentIntentStatus == "succeeded"
                ? 2500
                : 0;

        return CreateEventJson(
            eventType,
            eventId,
            new
            {
                id = paymentIntentId,
                @object = "payment_intent",

                amount = 2500,

                amount_capturable = 0,

                amount_received =
                    amountReceived,

                capture_method =
                    "automatic",

                confirmation_method =
                    "automatic",

                created =
                    DateTimeOffset.UtcNow
                        .ToUnixTimeSeconds(),

                currency = "eur",

                livemode = false,

                metadata =
                    new Dictionary<string, string>(),

                payment_method_types =
                    new[] { "card" },

                status =
                    paymentIntentStatus
            });
    }

    private static string CreateEventJson(
        string eventType,
        string eventId,
        object dataObject)
    {
        return JsonSerializer.Serialize(
            new
            {
                id = eventId,

                @object = "event",

                // Use the API version expected by
                // the installed Stripe.net SDK.
                api_version =
                    StripeConfiguration.ApiVersion,

                created =
                    DateTimeOffset.UtcNow
                        .ToUnixTimeSeconds(),

                data = new
                {
                    @object = dataObject
                },

                livemode = false,

                pending_webhooks = 1,

                request = new
                {
                    id = "req_unit_test",

                    idempotency_key =
                        (string?)null
                },

                type = eventType
            });
    }
}