using Reservations.Application.Common.Pagination;
using Reservations.Application.DTOs.External.Payment;
using Reservations.Application.DTOs.External.Restaurant;
using Reservations.Application.DTOs.Requests;
using Reservations.Application.DTOs.Responses;
using Reservations.Application.Interfaces;
using Reservations.Domain.Entities;
using Reservations.Domain.ValueObjects;

namespace Reservations.Application.Services;

public class ReservationService : IReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IRestaurantClient _restaurantClient;
    private readonly IPaymentClient _paymentClient;
    private readonly INotificationClient _notificationClient;

    public ReservationService(
        IReservationRepository reservationRepository,
        IRestaurantClient restaurantClient,
        IPaymentClient paymentClient,
        INotificationClient notificationClient)
    {
        _reservationRepository = reservationRepository;
        _restaurantClient = restaurantClient;
        _paymentClient = paymentClient;
        _notificationClient = notificationClient;
    }

    private async Task<Reservation> GetReservationAsync(
        Guid reservationId,
        Guid userId)
    {
        var reservation =
            await _reservationRepository.GetByIdAsync(
                reservationId);

        if (reservation == null)
        {
            throw new KeyNotFoundException(
                "Reservation not found.");
        }

        if (reservation.UserId != userId)
        {
            throw new UnauthorizedAccessException(
                "You are not allowed to access this reservation.");
        }

        return reservation;
    }

    private async Task ValidateAvailabilityAsync(
        TableGroupResponse tableGroup,
        DateTime startTime,
        DateTime endTime,
        Guid? reservationIdToIgnore = null)
    {
        var reservedTables =
            await _reservationRepository.CountActiveReservationsAsync(
                tableGroup.Id,
                startTime,
                endTime,
                reservationIdToIgnore);

        if (reservedTables >= tableGroup.TableCount)
        {
            throw new InvalidOperationException(
                "No available tables for the selected time.");
        }
    }

    private static TableGroupResponse GetTableGroup(
        RestaurantInfoResponse restaurant,
        int tableGroupId)
    {
        var tableGroup =
            restaurant.TableGroups.FirstOrDefault(
                table => table.Id == tableGroupId);

        if (tableGroup == null)
        {
            throw new KeyNotFoundException(
                "Table group was not found.");
        }

        return tableGroup;
    }
    
    private static void ValidateGuestCapacity(
        TableGroupResponse tableGroup,
        int guestNumber)
    {
        if (guestNumber <= 0)
        {
            throw new InvalidOperationException(
                "Guest number must be greater than zero.");
        }

        if (guestNumber > tableGroup.Capacity)
        {
            throw new InvalidOperationException(
                "The selected table does not have enough seats.");
        }
    }

    private async Task<List<Order>> BuildOrdersAsync(
        int restaurantId,
        IEnumerable<OrderRequest>? requests)
    {
        var requestList =
            requests?.ToList() ?? new List<OrderRequest>();

        if (requestList.Count == 0)
        {
            return new List<Order>();
        }

        foreach (var request in requestList)
        {
            if (request.Quantity <= 0)
            {
                throw new InvalidOperationException(
                    "Order quantity must be greater than zero.");
            }
        }

        var menuItems =
            await _restaurantClient.GetMenuItemsAsync(
                restaurantId,
                requestList.Select(
                    request => request.MenuItemId));

        var menuItemsById =
            menuItems.ToDictionary(
                menuItem => menuItem.MenuItemId);

        var orders = new List<Order>();

        foreach (var request in requestList)
        {
            if (!menuItemsById.TryGetValue(
                    request.MenuItemId,
                    out var menuItem))
                throw new KeyNotFoundException(
                    $"Menu item {request.MenuItemId} was not found.");

            orders.Add(
                new Order
                {
                    MenuItemId = menuItem.MenuItemId,
                    FoodName = menuItem.FoodName,
                    Price = menuItem.Price,
                    Quantity = request.Quantity
                });
        }

        return orders;
    }

    private async Task<RestaurantInfoResponse>
        GetRestaurantInfoAsync(
            int restaurantId)
    {
        var restaurant =
            await _restaurantClient.GetRestaurantInfoAsync(
                restaurantId);

        if (restaurant == null)
        {
            throw new KeyNotFoundException(
                "Restaurant was not found.");
        }

        return restaurant;
    }

    private ReservationResponse MapToResponse(
        Reservation reservation,
        RestaurantInfoResponse restaurant,
        TableGroupResponse tableGroup)
    {
        return new ReservationResponse
        {
            Id = reservation.Id,

            RestaurantId = reservation.RestaurantId,
            RestaurantName = restaurant.RestaurantName,
            RestaurantAddress = restaurant.RestaurantAddress,
            RestaurantCity = restaurant.RestaurantCity,

            TableGroupId = reservation.TableGroupId,
            TableLocation = tableGroup.Location,
            TableSeats = tableGroup.Capacity,

            Date = DateOnly.FromDateTime(
                reservation.StartTime),

            StartTime = TimeOnly.FromDateTime(
                reservation.StartTime),

            GuestNumber = reservation.GuestNumber,

            ServingTime =
                reservation.ServingTime?.ToString(@"hh\:mm"),

            TotalAmount = reservation.TotalAmount,

            Status = reservation.Status,
            PaymentStatus = reservation.PaymentStatus,

            Orders = reservation.Orders
                .Select(order => new OrderResponse
                {
                    MenuItemId = order.MenuItemId,
                    FoodName = order.FoodName,
                    Price = order.Price,
                    Quantity = order.Quantity,
                    Total = order.Price * order.Quantity
                })
                .ToList()
        };
    }

    private static void ValidateWorkingHours(
        RestaurantInfoResponse restaurant,
        DateTime startTime,
        DateTime endTime)
    {
        var openingTime =
            restaurant.OpeningTime.ToTimeSpan();

        var closingTime =
            restaurant.ClosingTime.ToTimeSpan();

        DateTime openingDateTime;
        DateTime closingDateTime;

        // Restaurant closes after midnight.
        // Example: 09:00 -> 03:00.
        if (closingTime <= openingTime)
        {
            // 00:00 - 03:00 belongs to the previous day's
            // restaurant working period.
            if (startTime.TimeOfDay <= closingTime)
            {
                openingDateTime =
                    startTime.Date
                        .AddDays(-1)
                        .Add(openingTime);

                closingDateTime =
                    startTime.Date
                        .Add(closingTime);
            }
            else
            {
                openingDateTime =
                    startTime.Date
                        .Add(openingTime);

                closingDateTime =
                    startTime.Date
                        .AddDays(1)
                        .Add(closingTime);
            }
        }
        else
        {
            // Normal working hours, e.g. 09:00 -> 23:00.
            openingDateTime =
                startTime.Date.Add(openingTime);

            closingDateTime =
                startTime.Date.Add(closingTime);
        }

        if (startTime < openingDateTime)
        {
            throw new InvalidOperationException(
                "The restaurant is not open at the selected time.");
        }

        if (startTime >= closingDateTime)
        {
            throw new InvalidOperationException(
                "The restaurant is already closed at the selected time.");
        }

        if (endTime > closingDateTime)
        {
            throw new InvalidOperationException(
                "The reservation would end after the restaurant closes.");
        }
    }

    public async Task<List<AvailableSlotResponse>>
        GetAvailableSlotsAsync(
            int restaurantId,
            DateOnly date)
    {
        var restaurant =
            await GetRestaurantInfoAsync(
                restaurantId);

        var slots =
            new List<AvailableSlotResponse>();

        var current =
            date.ToDateTime(
                restaurant.OpeningTime);

        var closing =
            date.ToDateTime(
                restaurant.ClosingTime);

        if (restaurant.ClosingTime <=
            restaurant.OpeningTime)
        {
            closing = closing.AddDays(1);
        }

        while (
            current
                .AddMinutes(
                    restaurant.ReservationDurationMinutes)
            <= closing
        )
        {
            var end =
                current.AddMinutes(
                    restaurant.ReservationDurationMinutes);

            var hasAvailableTable = false;

            foreach (var tableGroup in restaurant.TableGroups)
            {
                var reservedTables =
                    await _reservationRepository
                        .CountActiveReservationsAsync(
                            tableGroup.Id,
                            current,
                            end);

                if (reservedTables < tableGroup.TableCount)
                {
                    hasAvailableTable = true;
                    break;
                }
            }

            if (hasAvailableTable)
            {
                slots.Add(
                    new AvailableSlotResponse
                    {
                        Time =
                            TimeOnly.FromDateTime(
                                current)
                    });
            }

            current =
                current.AddMinutes(30);
        }

        return slots;
    }

    public async Task<List<AvailableTableResponse>>
        GetAvailableTablesAsync(
            int restaurantId,
            DateOnly date,
            TimeOnly time)
    {
        var restaurant =
            await GetRestaurantInfoAsync(
                restaurantId);

        var startTime =
            date.ToDateTime(time);

        var endTime =
            startTime.AddMinutes(
                restaurant.ReservationDurationMinutes);
        
        ValidateWorkingHours(
            restaurant,
            startTime,
            endTime);

        var availableTables =
            new List<AvailableTableResponse>();

        foreach (var tableGroup in restaurant.TableGroups)
        {
            var reservedTables =
                await _reservationRepository
                    .CountActiveReservationsAsync(
                        tableGroup.Id,
                        startTime,
                        endTime);

            var available =
                tableGroup.TableCount - reservedTables;

            availableTables.Add(
                new AvailableTableResponse
                {
                    TableGroupId = tableGroup.Id,
                    Location = tableGroup.Location,
                    Capacity = tableGroup.Capacity,
                    AvailableTables =
                        Math.Max(0, available)
                });
        }

        return availableTables;
    }

    public async Task<ReservationResponse>
        CreateReservationAsync(
            Guid userId,
            CreateReservationRequest request)
    {
        var restaurant =
            await GetRestaurantInfoAsync(
                request.RestaurantId);

        var tableGroup =
            GetTableGroup(
                restaurant,
                request.TableGroupId);
        
        ValidateGuestCapacity(
            tableGroup,
            request.GuestNumber);

        var startTime =
            DateTime.SpecifyKind(
                request.Date.ToDateTime(
                    request.StartTime),
                DateTimeKind.Utc);

        var endTime =
            startTime.AddMinutes(
                restaurant.ReservationDurationMinutes);

        ValidateWorkingHours(
            restaurant,
            startTime,
            endTime);

        await ValidateAvailabilityAsync(
            tableGroup,
            startTime,
            endTime);

        var reservation =
            new Reservation(
                userId,
                request.RestaurantId,
                request.TableGroupId,
                startTime,
                endTime,
                request.GuestNumber,
                request.ServingTime?.ToTimeSpan());

        var orders =
            await BuildOrdersAsync(
                request.RestaurantId,
                request.Orders);

        reservation.SetOrders(
            orders);

        await _reservationRepository.AddAsync(
            reservation);

        return MapToResponse(
            reservation,
            restaurant,
            tableGroup);
    }

    public async Task<ReservationResponse>
        GetReservationByIdAsync(
            Guid reservationId,
            Guid userId)
    {
        var reservation =
            await GetReservationAsync(
                reservationId,
                userId);

        var restaurant =
            await GetRestaurantInfoAsync(
                reservation.RestaurantId);

        var tableGroup =
            GetTableGroup(
                restaurant,
                reservation.TableGroupId);

        return MapToResponse(
            reservation,
            restaurant,
            tableGroup);
    }

    public async Task<PaginatedResult<ReservationResponse>>
        GetUserReservationsAsync(
            Guid userId,
            ReservationQueryRequest request)
    {
        var result =
            await _reservationRepository.GetForUserAsync(
                userId,
                request);

        var responses =
            new List<ReservationResponse>();

        foreach (var reservation in result.Items)
        {
            var restaurant =
                await GetRestaurantInfoAsync(
                    reservation.RestaurantId);

            var tableGroup =
                GetTableGroup(
                    restaurant,
                    reservation.TableGroupId);

            responses.Add(
                MapToResponse(
                    reservation,
                    restaurant,
                    tableGroup));
        }

        return new PaginatedResult<ReservationResponse>
        {
            Items = responses,
            Page = result.Page,
            PageSize = result.PageSize,
            TotalCount = result.TotalCount
        };
    }

    public async Task<ReservationResponse>
        UpdateReservationAsync(
            Guid reservationId,
            Guid userId,
            UpdateReservationRequest request)
    {
        var reservation =
            await GetReservationAsync(
                reservationId,
                userId);

        var restaurant =
            await GetRestaurantInfoAsync(
                reservation.RestaurantId);

        var tableGroup =
            GetTableGroup(
                restaurant,
                request.TableGroupId);
        
        ValidateGuestCapacity(
            tableGroup,
            request.GuestNumber);

        var startTime =
            DateTime.SpecifyKind(
                request.Date.ToDateTime(
                    request.StartTime),
                DateTimeKind.Utc);

        var endTime =
            startTime.AddMinutes(
                restaurant.ReservationDurationMinutes);

        ValidateWorkingHours(
            restaurant,
            startTime,
            endTime);

        await ValidateAvailabilityAsync(
            tableGroup,
            startTime,
            endTime,
            reservation.Id);

        reservation.UpdateDetails(
            request.TableGroupId,
            startTime,
            endTime,
            request.GuestNumber,
            request.ServingTime?.ToTimeSpan());

        await _reservationRepository.UpdateAsync(
            reservation);

        return MapToResponse(
            reservation,
            restaurant,
            tableGroup);
    }

    public async Task<ReservationResponse>
        UpdateOrdersAsync(
            Guid reservationId,
            Guid userId,
            UpdateReservationOrdersRequest request)
    {
        var reservation =
            await GetReservationAsync(
                reservationId,
                userId);

        var orders =
            await BuildOrdersAsync(
                reservation.RestaurantId,
                request.Orders);

        reservation.SetOrders(
            orders);

        await _reservationRepository.UpdateAsync(
            reservation);

        var restaurant =
            await GetRestaurantInfoAsync(
                reservation.RestaurantId);

        var tableGroup =
            GetTableGroup(
                restaurant,
                reservation.TableGroupId);

        return MapToResponse(
            reservation,
            restaurant,
            tableGroup);
    }

    public async Task<StartPaymentResponse>
        StartPaymentAsync(
            Guid reservationId,
            Guid userId)
    {
        var reservation =
            await GetReservationAsync(
                reservationId,
                userId);

        if (!reservation.CanStartPayment())
        {
            throw new InvalidOperationException(
                "Payment cannot be started for this reservation.");
        }

        /*
         * ReservationId is the correlation key.
         *
         * The Payment service is responsible for the logical payment,
         * Stripe PaymentIntent and any internal payment retries.
         */
        var payment =
            await _paymentClient.CreatePaymentAsync(
                new CreatePaymentRequest
                {
                    ReservationId = reservation.Id,
                    Amount = reservation.TotalAmount,
                    Currency = "RSD"
                });

        /*
         * The request was accepted by the Payment service.
         * Locally, payment now enters the Pending state.
         */
        reservation.StartPayment();

        switch (payment.Status)
        {
            case PaymentStatus.PaymentPending:
                break;

            case PaymentStatus.PaymentSucceeded:
                reservation.MarkPaymentSucceeded();
                break;

            case PaymentStatus.PaymentFailed:
                reservation.MarkPaymentFailed();
                break;

            case PaymentStatus.RefundPending:
            case PaymentStatus.RefundSucceeded:
            case PaymentStatus.RefundFailed:
                throw new InvalidOperationException(
                    "Payment service returned a refund status " +
                    "while starting a payment.");

            default:
                throw new ArgumentOutOfRangeException(
                    nameof(payment.Status),
                    payment.Status,
                    "Unsupported payment status.");
        }

        await _reservationRepository.UpdateAsync(
            reservation);

        return new StartPaymentResponse
        {
            ReservationId = reservation.Id,
            ClientSecret = payment.ClientSecret,
            PaymentStatus = reservation.PaymentStatus
        };
    }

    public async Task CancelReservationAsync(
        Guid reservationId,
        Guid userId)
    {
        var reservation =
            await GetReservationAsync(
                reservationId,
                userId);

        var requiresRefund =
            reservation.RequiresRefund;

        reservation.Cancel();

        if (requiresRefund)
        {
            reservation.MarkRefundPending();
        }

        /*
         * Persist cancellation before calling the Payment service.
         *
         * This means that if the external refund request fails,
         * the reservation itself is still correctly cancelled and
         * payment remains in RefundPending.
         */
        await _reservationRepository.UpdateAsync(
            reservation);

        if (requiresRefund)
        {
            var refund =
                await _paymentClient.RefundPaymentAsync(
                    new RefundPaymentRequest
                    {
                        ReservationId = reservation.Id,
                        Reason = "Reservation cancelled"
                    });

            switch (refund.Status)
            {
                case PaymentStatus.RefundPending:
                    break;

                case PaymentStatus.RefundSucceeded:
                    reservation.MarkPaymentRefunded();
                    break;

                case PaymentStatus.RefundFailed:
                    reservation.MarkRefundFailed();
                    break;

                case PaymentStatus.PaymentPending:
                case PaymentStatus.PaymentSucceeded:
                case PaymentStatus.PaymentFailed:
                    throw new InvalidOperationException(
                        "Payment service returned a payment status " +
                        "while processing a refund.");

                default:
                    throw new ArgumentOutOfRangeException(
                        nameof(refund.Status),
                        refund.Status,
                        "Unsupported refund status.");
            }

            await _reservationRepository.UpdateAsync(
                reservation);
        }

        await _notificationClient
            .SendReservationCancelledAsync(
                reservation.Id);
    }

    public async Task HandlePaymentStatusUpdateAsync(
        PaymentStatusUpdateRequest request)
    {
        var reservation =
            await _reservationRepository.GetByIdAsync(
                request.ReservationId);

        if (reservation == null)
        {
            throw new KeyNotFoundException(
                "Reservation not found.");
        }

        /*
         * Reservations does not process raw Stripe events.
         *
         * The Payment service must first process Stripe/webhook
         * information and send the current logical status associated
         * with this ReservationId.
         */
        switch (request.Status)
        {
            case PaymentStatus.PaymentPending:
                /*
                 * StartPaymentAsync normally already changed
                 * the local payment status to Pending.
                 *
                 * Nothing else is required here.
                 */
                break;

            case PaymentStatus.PaymentSucceeded:
                reservation.MarkPaymentSucceeded();
                break;

            case PaymentStatus.PaymentFailed:
                reservation.MarkPaymentFailed();
                break;

            case PaymentStatus.RefundPending:
                /*
                 * Usually CancelReservationAsync already moved
                 * the local state to RefundPending.
                 *
                 * But this also supports a refund initiated
                 * asynchronously by the Payment service.
                 */
                if (reservation.PaymentStatus ==
                    ReservationPaymentStatus.Succeeded ||
                    reservation.PaymentStatus ==
                    ReservationPaymentStatus.RefundFailed)
                {
                    reservation.MarkRefundPending();
                }

                break;

            case PaymentStatus.RefundSucceeded:
                /*
                 * A final refund update may arrive without a separate
                 * RefundPending update, so normalize the domain state
                 * before marking the refund as complete.
                 */
                if (reservation.PaymentStatus ==
                    ReservationPaymentStatus.Succeeded ||
                    reservation.PaymentStatus ==
                    ReservationPaymentStatus.RefundFailed)
                {
                    reservation.MarkRefundPending();
                }

                reservation.MarkPaymentRefunded();
                break;

            case PaymentStatus.RefundFailed:
                /*
                 * Same idea as above: the Payment service may report
                 * the final refund result directly.
                 */
                if (reservation.PaymentStatus ==
                    ReservationPaymentStatus.Succeeded)
                {
                    reservation.MarkRefundPending();
                }

                reservation.MarkRefundFailed();
                break;

            default:
                throw new ArgumentOutOfRangeException(
                    nameof(request.Status),
                    request.Status,
                    "Unsupported payment status.");
        }

        await _reservationRepository.UpdateAsync(
            reservation);
    }
}