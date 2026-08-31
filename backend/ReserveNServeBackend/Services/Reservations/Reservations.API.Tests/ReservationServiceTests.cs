using Moq;
using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.DTOs.External.Restaurant;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.Interfaces;
using Reservations.Application.Services;
using Reservations.Domain.Entities;
using Reservations.Domain.ValueObjects;
using Xunit;

namespace Reservations.API.Tests;

public class ReservationServiceTests
{
    private const string Email = "test@example.com";

    private readonly Mock<IReservationRepository> _repositoryMock = new(MockBehavior.Strict);
    private readonly Mock<IRestaurantClient> _restaurantClientMock = new(MockBehavior.Strict);
    private readonly Mock<IPaymentClient> _paymentClientMock = new(MockBehavior.Strict);
    private readonly Mock<INotificationClient> _notificationClientMock = new(MockBehavior.Strict);

    private ReservationService CreateService() =>
        new(_repositoryMock.Object, _restaurantClientMock.Object,
            _paymentClientMock.Object, _notificationClientMock.Object);

    [Fact]
    public async Task CreateReservationAsync_CreatesTableOnlyReservation_AndSendsConfirmation()
    {
        var userId = Guid.NewGuid();
        var request = CreateRequest();
        var restaurant = CreateRestaurant();

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(restaurant);

        _repositoryMock
            .Setup(repository => repository.CountActiveReservationsAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null))
            .ReturnsAsync(0);

        Reservation? savedReservation = null;

        _repositoryMock
            .Setup(repository => repository.AddAsync(It.IsAny<Reservation>()))
            .Callback<Reservation>(reservation => savedReservation = reservation)
            .Returns(Task.CompletedTask);

        _notificationClientMock
            .Setup(client => client.SendReservationConfirmedAsync(
                It.Is<ReservationConfirmedNotification>(notification =>
                    notification.Email == Email &&
                    notification.RestaurantName == "Test Restaurant" &&
                    notification.TableLocation == "Inside" &&
                    notification.Orders.Count == 0 &&
                    notification.ReceiptUrl == null)))
            .Returns(Task.CompletedTask);

        var result = await CreateService()
            .CreateReservationAsync(userId, Email, request);

        Assert.NotNull(savedReservation);
        Assert.Equal(userId, savedReservation.UserId);
        Assert.Equal(Email, savedReservation.ContactEmail);
        Assert.Equal(20, savedReservation.RestaurantId);
        Assert.Equal(1, savedReservation.TableGroupId);
        Assert.Equal(2, savedReservation.GuestNumber);
        Assert.Equal(ReservationStatus.Confirmed, savedReservation.Status);
        Assert.Equal(ReservationPaymentStatus.NotRequired, savedReservation.PaymentStatus);

        Assert.Equal("Test Restaurant", result.RestaurantName);
        Assert.Equal("Inside", result.TableLocation);
        Assert.Empty(result.Orders);

        _repositoryMock.VerifyAll();
        _restaurantClientMock.VerifyAll();
        _notificationClientMock.VerifyAll();
        _paymentClientMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateReservationAsync_WithFood_CreatesReservation_WithoutSendingConfirmation()
    {
        var userId = Guid.NewGuid();
        var request = CreateRequest();

        request.Orders =
        [
            new OrderRequest { MenuItemId = 101, Quantity = 2 }
        ];

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _repositoryMock
            .Setup(repository => repository.CountActiveReservationsAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null))
            .ReturnsAsync(0);

        _restaurantClientMock
            .Setup(client => client.GetMenuItemsAsync(
                20,
                It.Is<IEnumerable<int>>(ids =>
                    ids.SequenceEqual(new[] { 101 }))))
            .ReturnsAsync(
            [
                new MenuItemResponse
                {
                    MenuItemId = 101,
                    FoodName = "Pasta",
                    Price = 900m
                }
            ]);

        _repositoryMock
            .Setup(repository => repository.AddAsync(It.IsAny<Reservation>()))
            .Returns(Task.CompletedTask);

        var result = await CreateService()
            .CreateReservationAsync(userId, Email, request);

        Assert.Single(result.Orders);
        Assert.Equal("Pasta", result.Orders[0].FoodName);
        Assert.Equal(2, result.Orders[0].Quantity);
        Assert.Equal(1800m, result.Orders[0].Total);
        Assert.Equal(1800m, result.TotalAmount);
        Assert.Equal(ReservationPaymentStatus.NotStarted, result.PaymentStatus);

        _notificationClientMock.Verify(
            client => client.SendReservationConfirmedAsync(
                It.IsAny<ReservationConfirmedNotification>()),
            Times.Never);

        _paymentClientMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateReservationAsync_Throws_WhenNoTableIsAvailable()
    {
        var request = CreateRequest();

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _repositoryMock
            .Setup(repository => repository.CountActiveReservationsAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null))
            .ReturnsAsync(3);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateService()
                .CreateReservationAsync(Guid.NewGuid(), Email, request));

        Assert.Equal(
            "No available tables for the selected time.",
            exception.Message);

        _repositoryMock.Verify(
            repository => repository.AddAsync(It.IsAny<Reservation>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateReservationAsync_Throws_WhenGuestCountExceedsTableCapacity()
    {
        var request = CreateRequest();
        request.GuestNumber = 5;

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateService()
                .CreateReservationAsync(Guid.NewGuid(), Email, request));

        Assert.Equal(
            "The selected table does not have enough seats.",
            exception.Message);

        _repositoryMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateReservationAsync_Throws_WhenMenuItemDoesNotExist()
    {
        var request = CreateRequest();

        request.Orders =
        [
            new OrderRequest { MenuItemId = 999, Quantity = 1 }
        ];

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _repositoryMock
            .Setup(repository => repository.CountActiveReservationsAsync(
                1, It.IsAny<DateTime>(), It.IsAny<DateTime>(), null))
            .ReturnsAsync(0);

        _restaurantClientMock
            .Setup(client => client.GetMenuItemsAsync(
                20, It.IsAny<IEnumerable<int>>()))
            .ReturnsAsync(Array.Empty<MenuItemResponse>());

        var exception = await Assert.ThrowsAsync<KeyNotFoundException>(
            () => CreateService()
                .CreateReservationAsync(Guid.NewGuid(), Email, request));

        Assert.Equal(
            "Menu item 999 was not found.",
            exception.Message);

        _repositoryMock.Verify(
            repository => repository.AddAsync(It.IsAny<Reservation>()),
            Times.Never);
    }

    [Fact]
    public async Task HandlePaymentStatusUpdateAsync_PaymentSucceeded_UpdatesStatus_AndSendsConfirmation()
    {
        var reservation = CreatePendingPaymentReservation(Guid.NewGuid());
        const string receiptUrl = "https://stripe.test/receipt";

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _repositoryMock
            .Setup(repository => repository.UpdateAsync(reservation))
            .Returns(Task.CompletedTask);

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _notificationClientMock
            .Setup(client => client.SendReservationConfirmedAsync(
                It.Is<ReservationConfirmedNotification>(notification =>
                    notification.ReservationId == reservation.Id &&
                    notification.Email == Email &&
                    notification.ReceiptUrl == receiptUrl &&
                    notification.Orders.Count == 1)))
            .Returns(Task.CompletedTask);

        await CreateService().HandlePaymentStatusUpdateAsync(
            new PaymentStatusUpdateRequest
            {
                ReservationId = reservation.Id,
                Status = PaymentStatus.PaymentSucceeded,
                ReceiptUrl = receiptUrl
            });

        Assert.Equal(
            ReservationPaymentStatus.Succeeded,
            reservation.PaymentStatus);

        _repositoryMock.VerifyAll();
        _restaurantClientMock.VerifyAll();
        _notificationClientMock.VerifyAll();
        _paymentClientMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandlePaymentStatusUpdateAsync_DuplicatePaymentSucceeded_DoesNotSendDuplicateConfirmation()
    {
        var reservation = CreatePendingPaymentReservation(Guid.NewGuid());

        reservation.MarkPaymentSucceeded();

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _repositoryMock
            .Setup(repository => repository.UpdateAsync(reservation))
            .Returns(Task.CompletedTask);

        await CreateService().HandlePaymentStatusUpdateAsync(
            new PaymentStatusUpdateRequest
            {
                ReservationId = reservation.Id,
                Status = PaymentStatus.PaymentSucceeded
            });

        Assert.Equal(
            ReservationPaymentStatus.Succeeded,
            reservation.PaymentStatus);

        _notificationClientMock.Verify(
            client => client.SendReservationConfirmedAsync(
                It.IsAny<ReservationConfirmedNotification>()),
            Times.Never);

        _restaurantClientMock.VerifyNoOtherCalls();
        _paymentClientMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandlePaymentStatusUpdateAsync_RefundSucceeded_UpdatesStatus_AndSendsRefundNotification()
    {
        var reservation = CreatePendingPaymentReservation(Guid.NewGuid());

        reservation.MarkPaymentSucceeded();
        reservation.MarkRefundPending();

        const string receiptUrl = "https://stripe.test/receipt";

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _repositoryMock
            .Setup(repository => repository.UpdateAsync(reservation))
            .Returns(Task.CompletedTask);

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _notificationClientMock
            .Setup(client => client.SendReservationRefundedAsync(
                It.Is<ReservationRefundedNotification>(notification =>
                    notification.ReservationId == reservation.Id &&
                    notification.Email == Email &&
                    notification.Amount == 900m &&
                    notification.ReceiptUrl == receiptUrl)))
            .Returns(Task.CompletedTask);

        await CreateService().HandlePaymentStatusUpdateAsync(
            new PaymentStatusUpdateRequest
            {
                ReservationId = reservation.Id,
                Status = PaymentStatus.RefundSucceeded,
                ReceiptUrl = receiptUrl
            });

        Assert.Equal(
            ReservationPaymentStatus.Refunded,
            reservation.PaymentStatus);

        _repositoryMock.VerifyAll();
        _restaurantClientMock.VerifyAll();
        _notificationClientMock.VerifyAll();
        _paymentClientMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task HandlePaymentStatusUpdateAsync_DuplicateRefundSucceeded_DoesNotSendDuplicateRefundNotification()
    {
        var reservation = CreatePendingPaymentReservation(Guid.NewGuid());

        reservation.MarkPaymentSucceeded();
        reservation.MarkRefundPending();
        reservation.MarkPaymentRefunded();

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _repositoryMock
            .Setup(repository => repository.UpdateAsync(reservation))
            .Returns(Task.CompletedTask);

        await CreateService().HandlePaymentStatusUpdateAsync(
            new PaymentStatusUpdateRequest
            {
                ReservationId = reservation.Id,
                Status = PaymentStatus.RefundSucceeded
            });

        Assert.Equal(
            ReservationPaymentStatus.Refunded,
            reservation.PaymentStatus);

        _notificationClientMock.Verify(
            client => client.SendReservationRefundedAsync(
                It.IsAny<ReservationRefundedNotification>()),
            Times.Never);

        _restaurantClientMock.VerifyNoOtherCalls();
        _paymentClientMock.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CancelReservationAsync_TableOnly_CancelsWithoutRefund_AndSendsNotification()
    {
        var userId = Guid.NewGuid();
        var reservation = CreateTableOnlyReservation(userId);

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _repositoryMock
            .Setup(repository => repository.UpdateAsync(reservation))
            .Returns(Task.CompletedTask);

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _notificationClientMock
            .Setup(client => client.SendReservationCancelledAsync(
                It.Is<ReservationCancelledNotification>(notification =>
                    notification.ReservationId == reservation.Id &&
                    notification.Email == Email &&
                    !notification.RefundExpected &&
                    notification.TotalAmount == 0m)))
            .Returns(Task.CompletedTask);

        await CreateService().CancelReservationAsync(reservation.Id, userId);

        Assert.Equal(ReservationStatus.Cancelled, reservation.Status);
        Assert.Equal(
            ReservationPaymentStatus.NotRequired,
            reservation.PaymentStatus);

        _paymentClientMock.Verify(
            client => client.RefundPaymentAsync(
                It.IsAny<RefundPaymentRequest>()),
            Times.Never);

        _repositoryMock.VerifyAll();
        _restaurantClientMock.VerifyAll();
        _notificationClientMock.VerifyAll();
    }

    [Fact]
    public async Task CancelReservationAsync_PaidReservation_StartsRefund_AndSendsCancellationNotification()
    {
        var userId = Guid.NewGuid();
        var reservation = CreatePendingPaymentReservation(userId);

        reservation.MarkPaymentSucceeded();

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _repositoryMock
            .Setup(repository => repository.UpdateAsync(reservation))
            .Returns(Task.CompletedTask);

        _paymentClientMock
            .Setup(client => client.RefundPaymentAsync(
                It.Is<RefundPaymentRequest>(request =>
                    request.ReservationId == reservation.Id &&
                    request.Reason == "Reservation cancelled")))
            .ReturnsAsync(new RefundPaymentResponse
            {
                Status = PaymentStatus.RefundPending
            });

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _notificationClientMock
            .Setup(client => client.SendReservationCancelledAsync(
                It.Is<ReservationCancelledNotification>(notification =>
                    notification.ReservationId == reservation.Id &&
                    notification.Email == Email &&
                    notification.RefundExpected &&
                    notification.TotalAmount == 900m)))
            .Returns(Task.CompletedTask);

        await CreateService().CancelReservationAsync(
            reservation.Id,
            userId);

        Assert.Equal(
            ReservationStatus.Cancelled,
            reservation.Status);

        Assert.Equal(
            ReservationPaymentStatus.RefundPending,
            reservation.PaymentStatus);

        _repositoryMock.Verify(
            repository => repository.UpdateAsync(reservation),
            Times.Exactly(2));

        _paymentClientMock.VerifyAll();
        _restaurantClientMock.VerifyAll();
        _notificationClientMock.VerifyAll();
    }

    [Fact]
    public async Task CancelReservationAsync_WhenRefundFails_MarksRefundFailed()
    {
        var userId = Guid.NewGuid();
        var reservation = CreatePendingPaymentReservation(userId);

        reservation.MarkPaymentSucceeded();

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        _repositoryMock
            .Setup(repository => repository.UpdateAsync(reservation))
            .Returns(Task.CompletedTask);

        _paymentClientMock
            .Setup(client => client.RefundPaymentAsync(
                It.Is<RefundPaymentRequest>(request =>
                    request.ReservationId == reservation.Id &&
                    request.Reason == "Reservation cancelled")))
            .ReturnsAsync(new RefundPaymentResponse
            {
                Status = PaymentStatus.RefundFailed
            });

        _restaurantClientMock
            .Setup(client => client.GetRestaurantInfoAsync(20))
            .ReturnsAsync(CreateRestaurant());

        _notificationClientMock
            .Setup(client => client.SendReservationCancelledAsync(
                It.Is<ReservationCancelledNotification>(notification =>
                    notification.ReservationId == reservation.Id &&
                    notification.Email == Email &&
                    notification.RefundExpected &&
                    notification.TotalAmount == 900m)))
            .Returns(Task.CompletedTask);

        await CreateService().CancelReservationAsync(
            reservation.Id,
            userId);

        Assert.Equal(
            ReservationStatus.Cancelled,
            reservation.Status);

        Assert.Equal(
            ReservationPaymentStatus.RefundFailed,
            reservation.PaymentStatus);

        _repositoryMock.Verify(
            repository => repository.UpdateAsync(reservation),
            Times.AtLeastOnce);

        _paymentClientMock.VerifyAll();
        _restaurantClientMock.VerifyAll();
        _notificationClientMock.VerifyAll();
    }

    [Fact]
    public async Task CancelReservationAsync_Throws_WhenPaymentIsPending()
    {
        var userId = Guid.NewGuid();
        var reservation = CreatePendingPaymentReservation(userId);

        _repositoryMock
            .Setup(repository => repository.GetByIdAsync(reservation.Id))
            .ReturnsAsync(reservation);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => CreateService()
                .CancelReservationAsync(reservation.Id, userId));

        Assert.Equal(
            ReservationStatus.Confirmed,
            reservation.Status);

        Assert.Equal(
            ReservationPaymentStatus.Pending,
            reservation.PaymentStatus);

        _repositoryMock.Verify(
            repository => repository.UpdateAsync(
                It.IsAny<Reservation>()),
            Times.Never);

        _paymentClientMock.VerifyNoOtherCalls();
        _restaurantClientMock.VerifyNoOtherCalls();
        _notificationClientMock.VerifyNoOtherCalls();
    }

    private static CreateReservationRequest CreateRequest() =>
        new()
        {
            RestaurantId = 20,
            TableGroupId = 1,
            Date = DateOnly.FromDateTime(
                DateTime.UtcNow.AddDays(20)),
            StartTime = new TimeOnly(19, 0),
            GuestNumber = 2,
            ServingTime = new TimeOnly(19, 30),
            Orders = []
        };

    private static RestaurantInfoResponse CreateRestaurant() =>
        new()
        {
            RestaurantName = "Test Restaurant",
            RestaurantAddress = "Knez Mihailova 1",
            RestaurantCity = "Belgrade",
            OpeningTime = new TimeOnly(9, 0),
            ClosingTime = new TimeOnly(23, 0),
            ReservationDurationMinutes = 120,
            TableGroups =
            [
                new TableGroupResponse
                {
                    Id = 1,
                    Location = "Inside",
                    Capacity = 4,
                    TableCount = 3
                },
                new TableGroupResponse
                {
                    Id = 2,
                    Location = "Terrace",
                    Capacity = 6,
                    TableCount = 2
                }
            ]
        };

    private static Reservation CreatePendingPaymentReservation(
        Guid userId)
    {
        var start = DateTime.SpecifyKind(
            DateTime.UtcNow.Date
                .AddDays(20)
                .AddHours(19),
            DateTimeKind.Utc);

        var reservation = new Reservation(
            userId,
            Email,
            20,
            1,
            start,
            start.AddHours(2),
            2,
            start.AddMinutes(30).TimeOfDay)
        {
            Id = Guid.NewGuid()
        };

        reservation.SetOrders(
        [
            new Order
            {
                MenuItemId = 101,
                FoodName = "Pasta",
                Price = 900m,
                Quantity = 1
            }
        ]);

        reservation.StartPayment();

        return reservation;
    }

    private static Reservation CreateTableOnlyReservation(
        Guid userId)
    {
        var start = DateTime.SpecifyKind(
            DateTime.UtcNow.Date
                .AddDays(20)
                .AddHours(19),
            DateTimeKind.Utc);

        return new Reservation(
            userId,
            Email,
            20,
            1,
            start,
            start.AddHours(2),
            2,
            null)
        {
            Id = Guid.NewGuid()
        };
    }
}