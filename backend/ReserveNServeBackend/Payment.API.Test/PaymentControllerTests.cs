using Microsoft.AspNetCore.Mvc;
using Moq;
using Payment.API.Controllers;
using Payment.API.DTO;
using Payment.API.Enums;
using Payment.API.Handler;
using Payment.API.Messaging;
using Payment.API.Repositories;
using Payment.API.Services;
using Stripe;
using System.Timers;
using PaymentEntity = Payment.API.Entities.Payment;

namespace Payment.API.Tests;

public class PaymentControllerTests
{
    private readonly Mock<IPaymentsRepository> _repositoryMock;
    private readonly Mock<IPaymentStatusPublisher> _publisherMock;
    private readonly Mock<IStripePaymentService> _stripeServiceMock;
    private readonly PaymentController _controller;

    public PaymentControllerTests()
    {
        _repositoryMock = new Mock<IPaymentsRepository>();
        _publisherMock = new Mock<IPaymentStatusPublisher>();
        _stripeServiceMock = new Mock<IStripePaymentService>();

        var handler = new PaymentsHandler(
            _repositoryMock.Object,
            _publisherMock.Object);

        _controller = new PaymentController(
            handler,
            _stripeServiceMock.Object);
    }

    [Fact]
    public async Task CreatePaymentIntent_ReturnsBadRequest_WhenReservationIdIsEmpty()
    {
        var request = new CreatePaymentIntentRequest
        {
            ReservationId = " ",
            Amount = 25.50m,
            Currency = "eur"
        };

        var result = await _controller.CreatePaymentIntent(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(
            "Invalid reservation ID. Reservation ID must be a non-empty string.",
            badRequest.Value);

        _repositoryMock.Verify(
            repository => repository.GetPaymentByReservationId(It.IsAny<string>()),
            Times.Never);

        _stripeServiceMock.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public async Task CreatePaymentIntent_ReturnsBadRequest_WhenAmountIsNotPositive(decimal amount)
    {
        var request = new CreatePaymentIntentRequest
        {
            ReservationId = "reservation-123",
            Amount = amount,
            Currency = "eur"
        };

        var result = await _controller.CreatePaymentIntent(request);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(
            "Invalid amount. Amount must be greater than zero.",
            badRequest.Value);

        _repositoryMock.Verify(
            repository => repository.GetPaymentByReservationId(It.IsAny<string>()),
            Times.Never);

        _stripeServiceMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreatePaymentIntent_ReturnsExistingPayment_WhenReservationAlreadyHasPayment()
    {
        var existingPayment = new PaymentEntity
        {
            id = 7,
            reservation_id = "reservation-123",
            payment_intent = "pi_existing",
            status = (int)PaymentStatus.PaymentSucceeded
        };

        _repositoryMock
            .Setup(repository => repository.GetPaymentByReservationId("reservation-123"))
            .ReturnsAsync(existingPayment);

        _stripeServiceMock
            .Setup(service => service.GetPaymentIntentAsync("pi_existing"))
            .ReturnsAsync(new PaymentIntent
            {
                Id = "pi_existing",
                ClientSecret = "secret_existing"
            });

        var request = new CreatePaymentIntentRequest
        {
            ReservationId = "reservation-123",
            Amount = 42.50m,
            Currency = "eur"
        };

        var result = await _controller.CreatePaymentIntent(request);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("secret_existing", ReadProperty<string>(ok.Value!, "clientSecret"));
        Assert.Equal((int)PaymentStatus.PaymentSucceeded, ReadProperty<int>(ok.Value!, "status"));

        _stripeServiceMock.Verify(
            service => service.GetPaymentIntentAsync("pi_existing"),
            Times.Once);

        _stripeServiceMock.Verify(
            service => service.CreatePaymentIntentAsync(It.IsAny<PaymentIntentCreateOptions>()),
            Times.Never);

        _repositoryMock.Verify(
            repository => repository.InsertNewPayment(It.IsAny<PaymentEntity>()),
            Times.Never);
    }

    [Fact]
    public async Task CreatePaymentIntent_CreatesPaymentAndStoresIt_WhenNoPaymentExists()
    {
        _repositoryMock
            .Setup(repository => repository.GetPaymentByReservationId("reservation-456"))
            .ReturnsAsync((PaymentEntity?)null);

        PaymentIntentCreateOptions? capturedOptions = null;

        _stripeServiceMock
            .Setup(service => service.CreatePaymentIntentAsync(It.IsAny<PaymentIntentCreateOptions>()))
            .Callback<PaymentIntentCreateOptions>(options => capturedOptions = options)
            .ReturnsAsync(new PaymentIntent
            {
                Id = "pi_new",
                ClientSecret = "secret_new"
            });

        PaymentEntity? insertedPayment = null;

        _repositoryMock
            .Setup(repository => repository.InsertNewPayment(It.IsAny<PaymentEntity>()))
            .Callback<PaymentEntity>(payment => insertedPayment = payment);

        var request = new CreatePaymentIntentRequest
        {
            ReservationId = "reservation-456",
            Amount = 12.345m,
            Currency = "eur"
        };

        var result = await _controller.CreatePaymentIntent(request);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal("secret_new", ReadProperty<string>(ok.Value!, "clientSecret"));
        Assert.Equal((int)PaymentStatus.PaymentPending, ReadProperty<int>(ok.Value!, "status"));

        Assert.NotNull(capturedOptions);
        Assert.Equal(1235L, capturedOptions!.Amount);
        Assert.Equal("eur", capturedOptions.Currency);
        Assert.Equal("reservation-456", capturedOptions.Metadata["reservationId"]);
        Assert.NotNull(capturedOptions.AutomaticPaymentMethods);
        Assert.True(capturedOptions.AutomaticPaymentMethods.Enabled);
        Assert.Equal("never", capturedOptions.AutomaticPaymentMethods.AllowRedirects);

        Assert.NotNull(insertedPayment);
        Assert.Equal("reservation-456", insertedPayment!.reservation_id);
        Assert.Equal("pi_new", insertedPayment.payment_intent);
        Assert.Equal((int)PaymentStatus.PaymentPending, insertedPayment.status);

        _repositoryMock.Verify(
            repository => repository.InsertNewPayment(It.IsAny<PaymentEntity>()),
            Times.Once);
    }

    [Fact]
    public async Task CreatePaymentIntent_Returns500_WhenStripeServiceThrowsUnexpectedException()
    {
        _repositoryMock
            .Setup(repository => repository.GetPaymentByReservationId("reservation-500"))
            .ReturnsAsync((PaymentEntity?)null);

        _stripeServiceMock
            .Setup(service => service.CreatePaymentIntentAsync(It.IsAny<PaymentIntentCreateOptions>()))
            .ThrowsAsync(new InvalidOperationException("Stripe unavailable"));

        var request = new CreatePaymentIntentRequest
        {
            ReservationId = "reservation-500",
            Amount = 10m,
            Currency = "eur"
        };

        var result = await _controller.CreatePaymentIntent(request);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, objectResult.StatusCode);
        Assert.Equal("An unexpected error occurred.", objectResult.Value);

        _repositoryMock.Verify(
            repository => repository.InsertNewPayment(It.IsAny<PaymentEntity>()),
            Times.Never);
    }

    [Fact]
    public async Task Refund_Returns404_WhenPaymentDoesNotExist()
    {
        _repositoryMock
            .Setup(repository => repository.GetPaymentByReservationId("missing-reservation"))
            .ReturnsAsync((PaymentEntity?)null);

        var request = new RefundRequest
        {
            ReservationId = "missing-reservation"
        };

        var result = await _controller.Refund(request);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(404, objectResult.StatusCode);
        Assert.Equal(
            "Payment not found for the given reservation ID.",
            objectResult.Value);

        _stripeServiceMock.Verify(
            service => service.CreateRefund(It.IsAny<RefundCreateOptions>()),
            Times.Never);
    }

    [Fact]
    public async Task Refund_Returns200_AndUsesCorrectPaymentIntent_WhenPaymentExists()
    {
        var payment = new PaymentEntity
        {
            id = 8,
            reservation_id = "reservation-refund",
            payment_intent = "pi_refund",
            status = (int)PaymentStatus.PaymentSucceeded
        };

        _repositoryMock
            .Setup(repository => repository.GetPaymentByReservationId("reservation-refund"))
            .ReturnsAsync(payment);

        RefundCreateOptions? capturedOptions = null;

        _stripeServiceMock
            .Setup(service => service.CreateRefund(It.IsAny<RefundCreateOptions>()))
            .Callback<RefundCreateOptions>(options => capturedOptions = options)
            .Returns(new Refund());

        var request = new RefundRequest
        {
            ReservationId = "reservation-refund"
        };

        var result = await _controller.Refund(request);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(200, objectResult.StatusCode);
        Assert.Equal("Refund processed successfully.", objectResult.Value);

        Assert.NotNull(capturedOptions);
        Assert.Equal("pi_refund", capturedOptions!.PaymentIntent);

        _stripeServiceMock.Verify(
            service => service.CreateRefund(It.IsAny<RefundCreateOptions>()),
            Times.Once);
    }

    [Fact]
    public async Task Refund_Returns500_WhenStripeServiceThrowsUnexpectedException()
    {
        var payment = new PaymentEntity
        {
            id = 9,
            reservation_id = "reservation-refund-error",
            payment_intent = "pi_error",
            status = (int)PaymentStatus.PaymentSucceeded
        };

        _repositoryMock
            .Setup(repository => repository.GetPaymentByReservationId("reservation-refund-error"))
            .ReturnsAsync(payment);

        _stripeServiceMock
            .Setup(service => service.CreateRefund(It.IsAny<RefundCreateOptions>()))
            .Throws(new InvalidOperationException("Refund provider unavailable"));

        var request = new RefundRequest
        {
            ReservationId = "reservation-refund-error"
        };

        var result = await _controller.Refund(request);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(500, objectResult.StatusCode);
        Assert.Equal("An unexpected error occurred.", objectResult.Value);
    }

    private static T ReadProperty<T>(object value, string propertyName)
    {
        var property = value.GetType().GetProperty(propertyName);
        Assert.NotNull(property);

        var propertyValue = property!.GetValue(value);
        return Assert.IsType<T>(propertyValue);
    }
}
