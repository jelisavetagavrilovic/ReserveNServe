using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Reservations.API.Controllers;
using Reservations.Application.Common.Pagination;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.DTOs.Responses;
using Reservations.Application.Interfaces;
using Reservations.Domain.ValueObjects;
using Xunit;

namespace Reservations.API.Tests;

public class ReservationsControllerTests
{
    private static readonly Guid UserId =
        Guid.Parse("11111111-1111-1111-1111-111111111111");

    private const string Email = "test@example.com";

    private readonly Mock<IReservationService> _serviceMock =
        new(MockBehavior.Strict);

    [Fact]
    public async Task CreateReservation_ReturnsCreatedAtAction_AndUsesAuthenticatedUser()
    {
        var request = new CreateReservationRequest
        {
            RestaurantId = 20,
            TableGroupId = 3,
            Date = new DateOnly(2030, 6, 15),
            StartTime = new TimeOnly(19, 0),
            GuestNumber = 2
        };

        var response = CreateResponse();

        _serviceMock
            .Setup(service => service.CreateReservationAsync(
                UserId, Email, request))
            .ReturnsAsync(response);

        var controller = CreateController();

        var result = await controller.CreateReservation(request);

        var created =
            Assert.IsType<CreatedAtActionResult>(result.Result);

        Assert.Equal(
            nameof(ReservationsController.GetReservation),
            created.ActionName);

        Assert.Equal(
            response.Id,
            created.RouteValues!["id"]);

        Assert.Same(response, created.Value);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task GetReservation_ReturnsOk_AndUsesAuthenticatedUser()
    {
        var reservationId = Guid.NewGuid();
        var response = CreateResponse(reservationId);

        _serviceMock
            .Setup(service => service.GetReservationByIdAsync(
                reservationId, UserId))
            .ReturnsAsync(response);

        var controller = CreateController();

        var result =
            await controller.GetReservation(reservationId);

        var ok =
            Assert.IsType<OkObjectResult>(result.Result);

        Assert.Same(response, ok.Value);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task GetUserReservations_ReturnsOk_AndPassesQuery()
    {
        var query = new ReservationQueryRequest
        {
            Page = 2,
            PageSize = 10,
            Type = ReservationType.Upcoming,
            Status = ReservationStatus.Confirmed
        };

        var page = new PaginatedResult<ReservationResponse>
        {
            Items = [CreateResponse()],
            Page = 2,
            PageSize = 10,
            TotalCount = 11
        };

        _serviceMock
            .Setup(service => service.GetUserReservationsAsync(
                UserId, query))
            .ReturnsAsync(page);

        var controller = CreateController();

        var result =
            await controller.GetUserReservations(query);

        var ok =
            Assert.IsType<OkObjectResult>(result);

        Assert.Same(page, ok.Value);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task UpdateReservation_ReturnsOk_AndPassesRequest()
    {
        var reservationId = Guid.NewGuid();

        var request = new UpdateReservationRequest
        {
            TableGroupId = 4,
            Date = new DateOnly(2030, 7, 10),
            StartTime = new TimeOnly(20, 0),
            GuestNumber = 4
        };

        var response =
            CreateResponse(reservationId);

        _serviceMock
            .Setup(service => service.UpdateReservationAsync(
                reservationId,
                UserId,
                request))
            .ReturnsAsync(response);

        var controller = CreateController();

        var result =
            await controller.UpdateReservation(
                reservationId,
                request);

        var ok =
            Assert.IsType<OkObjectResult>(result.Result);

        Assert.Same(response, ok.Value);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task UpdateOrders_ReturnsOk_AndPassesRequest()
    {
        var reservationId = Guid.NewGuid();

        var request =
            new UpdateReservationOrdersRequest
            {
                Orders =
                [
                    new OrderRequest
                    {
                        MenuItemId = 10,
                        Quantity = 2
                    }
                ]
            };

        var response =
            CreateResponse(reservationId);

        _serviceMock
            .Setup(service => service.UpdateOrdersAsync(
                reservationId,
                UserId,
                request))
            .ReturnsAsync(response);

        var controller = CreateController();

        var result =
            await controller.UpdateOrders(
                reservationId,
                request);

        var ok =
            Assert.IsType<OkObjectResult>(result.Result);

        Assert.Same(response, ok.Value);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task StartPayment_ReturnsOk_AndUsesAuthenticatedUser()
    {
        var reservationId = Guid.NewGuid();

        var response = new StartPaymentResponse
        {
            ReservationId = reservationId,
            ClientSecret = "secret_123",
            PaymentStatus =
                ReservationPaymentStatus.Pending
        };

        _serviceMock
            .Setup(service => service.StartPaymentAsync(
                reservationId,
                UserId))
            .ReturnsAsync(response);

        var controller = CreateController();

        var result =
            await controller.StartPayment(reservationId);

        var ok =
            Assert.IsType<OkObjectResult>(result.Result);

        Assert.Same(response, ok.Value);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task CancelReservation_ReturnsNoContent_AndUsesAuthenticatedUser()
    {
        var reservationId = Guid.NewGuid();

        _serviceMock
            .Setup(service => service.CancelReservationAsync(
                reservationId,
                UserId))
            .Returns(Task.CompletedTask);

        var controller = CreateController();

        var result =
            await controller.CancelReservation(
                reservationId);

        Assert.IsType<NoContentResult>(result);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task GetAvailableSlots_ReturnsOk_WithServiceResult()
    {
        var date =
            new DateOnly(2030, 8, 20);

        var slots =
            new List<AvailableSlotResponse>
            {
                new()
                {
                    Time = new TimeOnly(18, 0)
                },
                new()
                {
                    Time = new TimeOnly(18, 30)
                }
            };

        _serviceMock
            .Setup(service =>
                service.GetAvailableSlotsAsync(
                    20,
                    date,
                    2))
            .ReturnsAsync(slots);

        var controller = CreateController();

        var result =
            await controller.GetAvailableSlots(
                20,
                date,
                2);

        var ok =
            Assert.IsType<OkObjectResult>(
                result.Result);

        Assert.Same(slots, ok.Value);

        _serviceMock.VerifyAll();
    }

    [Fact]
    public async Task GetAvailableTables_ReturnsOk_WithServiceResult()
    {
        var date =
            new DateOnly(2030, 8, 20);

        var time =
            new TimeOnly(19, 0);

        var tables =
            new List<AvailableTableResponse>
            {
                new()
                {
                    TableGroupId = 3,
                    Location = "Terrace",
                    Capacity = 4,
                    AvailableTables = 2
                }
            };

        _serviceMock
            .Setup(service =>
                service.GetAvailableTablesAsync(
                    20,
                    date,
                    time,
                    2))
            .ReturnsAsync(tables);

        var controller = CreateController();

        var result =
            await controller.GetAvailableTables(
                20,
                date,
                time,
                2);

        var ok =
            Assert.IsType<OkObjectResult>(
                result.Result);

        Assert.Same(tables, ok.Value);

        _serviceMock.VerifyAll();
    }

    private ReservationsController CreateController()
    {
        var claims = new List<Claim>
        {
            new(
                ClaimTypes.NameIdentifier,
                UserId.ToString()),

            new(
                "sub",
                UserId.ToString()),

            new(
                "userId",
                UserId.ToString()),

            new(
                ClaimTypes.Email,
                Email),

            new(
                "email",
                Email)
        };

        var identity =
            new ClaimsIdentity(
                claims,
                "TestAuthentication");

        var principal =
            new ClaimsPrincipal(identity);

        var controller =
            new ReservationsController(
                _serviceMock.Object);

        controller.ControllerContext =
            new ControllerContext
            {
                HttpContext =
                    new DefaultHttpContext
                    {
                        User = principal
                    }
            };

        return controller;
    }

    private static ReservationResponse CreateResponse(
        Guid? id = null)
    {
        return new ReservationResponse
        {
            Id = id ?? Guid.NewGuid(),
            RestaurantId = 20,
            RestaurantName = "Test Restaurant",
            RestaurantAddress = "Knez Mihailova 1",
            RestaurantCity = "Belgrade",
            TableGroupId = 3,
            TableLocation = "Inside",
            TableSeats = 4,
            Date = new DateOnly(2030, 6, 15),
            StartTime = new TimeOnly(19, 0),
            GuestNumber = 2,
            TotalAmount = 0m,
            Status = ReservationStatus.Confirmed,
            PaymentStatus =
                ReservationPaymentStatus.NotRequired,
            Orders = []
        };
    }
}