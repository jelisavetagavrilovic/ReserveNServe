using System.Diagnostics;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace ReserveNServe.E2E.Tests;

public class ReservationFlowTests
{
    private readonly HttpClient _identityClient = new()
    {
        BaseAddress = new Uri("http://localhost:5206")
    };

    private readonly HttpClient _restaurantsClient = new()
    {
        BaseAddress = new Uri("http://localhost:5174")
    };

    private readonly HttpClient _reservationsClient = new(
        new HttpClientHandler
        {
            ServerCertificateCustomValidationCallback =
                HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
        })
    {
        BaseAddress = new Uri("https://localhost:7294")
    };

    private readonly HttpClient _mailpitClient = new()
    {
        BaseAddress = new Uri("http://localhost:8025")
    };


    [Fact]
    public async Task UserCanBrowseAvailabilityAndCreateTableOnlyReservation()
    {
        const int guestNumber = 2;

        // 1. Register, confirm, login
        var session = await RegisterConfirmAndLoginAsync();

        _reservationsClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);

        // 2. Get restaurants
        var restaurantsResponse = await _restaurantsClient.GetAsync(
            "/api/Restaurants/GetRestaurants?page=1&pageSize=100");

        Assert.Equal(HttpStatusCode.OK, restaurantsResponse.StatusCode);

        var restaurants = await restaurantsResponse.Content
            .ReadFromJsonAsync<GetRestaurantsResponse>();

        Assert.NotNull(restaurants);
        Assert.NotEmpty(restaurants.Items);

        // 3. Find restaurant, slot and table
        ReservationCandidate? candidate = null;

        foreach (var restaurant in restaurants.Items)
        {
            var infoResponse = await _restaurantsClient.GetAsync(
                $"/api/Restaurants/GetRestaurantInfo/{restaurant.Id}");

            if (!infoResponse.IsSuccessStatusCode)
                continue;

            var info = await infoResponse.Content
                .ReadFromJsonAsync<GetRestaurantInfoResponse>();

            if (info == null ||
                !info.TableGroups.Any(t =>
                    t.Capacity >= guestNumber &&
                    t.TableCount > 0))
                continue;

            for (var dayOffset = 1; dayOffset <= 7; dayOffset++)
            {
                var date = DateOnly.FromDateTime(
                    DateTime.UtcNow.AddDays(dayOffset));

                var slotsResponse = await _reservationsClient.GetAsync(
                    $"/api/reservations/availability/slots" +
                    $"?restaurantId={restaurant.Id}" +
                    $"&date={date:yyyy-MM-dd}" +
                    $"&guestNumber={guestNumber}");

                if (!slotsResponse.IsSuccessStatusCode)
                    continue;

                var slots = await slotsResponse.Content
                    .ReadFromJsonAsync<List<AvailableSlotResponse>>();

                if (slots == null || slots.Count == 0)
                    continue;

                foreach (var slot in slots)
                {
                    var time = slot.Time.ToString("HH:mm:ss");

                    var tablesResponse = await _reservationsClient.GetAsync(
                        $"/api/reservations/availability/tables" +
                        $"?restaurantId={restaurant.Id}" +
                        $"&date={date:yyyy-MM-dd}" +
                        $"&time={time}" +
                        $"&guestNumber={guestNumber}");

                    if (!tablesResponse.IsSuccessStatusCode)
                        continue;

                    var tables = await tablesResponse.Content
                        .ReadFromJsonAsync<List<AvailableTableResponse>>();

                    var table = tables?.FirstOrDefault(t =>
                        t.Capacity >= guestNumber &&
                        t.AvailableTables > 0);

                    if (table == null)
                        continue;

                    candidate = new ReservationCandidate(
                        restaurant.Id,
                        restaurant.Name,
                        table.TableGroupId,
                        date,
                        slot.Time);

                    break;
                }

                if (candidate != null)
                    break;
            }

            if (candidate != null)
                break;
        }

        Assert.NotNull(candidate);

        // 4. Create table-only reservation
        var createResponse = await _reservationsClient.PostAsJsonAsync(
            "/api/reservations",
            new
            {
                restaurantId = candidate.RestaurantId,
                tableGroupId = candidate.TableGroupId,
                date = candidate.Date.ToString("yyyy-MM-dd"),
                startTime = candidate.Time.ToString("HH:mm:ss"),
                guestNumber,
                orders = Array.Empty<object>(),
                servingTime = (string?)null
            });

        var createBody = await createResponse.Content.ReadAsStringAsync();

        Assert.True(
            createResponse.StatusCode == HttpStatusCode.Created,
            $"Create reservation failed with status " +
            $"{(int)createResponse.StatusCode}: {createBody}");

        using var createdJson = JsonDocument.Parse(createBody);
        var created = createdJson.RootElement;

        var reservationId = created.GetProperty("id").GetGuid();

        Assert.NotEqual(Guid.Empty, reservationId);
        Assert.Equal(
            candidate.RestaurantId,
            created.GetProperty("restaurantId").GetInt32());

        Assert.Equal(
            candidate.TableGroupId,
            created.GetProperty("tableGroupId").GetInt32());

        Assert.Equal(
            guestNumber,
            created.GetProperty("guestNumber").GetInt32());

        Assert.Equal(
            0m,
            created.GetProperty("totalAmount").GetDecimal());

        Assert.Equal(
            0,
            created.GetProperty("orders").GetArrayLength());

        // 5. Get the same reservation
        var getResponse = await _reservationsClient.GetAsync(
            $"/api/reservations/{reservationId}");

        var getBody = await getResponse.Content.ReadAsStringAsync();

        Assert.True(
            getResponse.IsSuccessStatusCode,
            $"Get reservation failed with status " +
            $"{(int)getResponse.StatusCode}: {getBody}");

        using var getJson = JsonDocument.Parse(getBody);
        var saved = getJson.RootElement;

        Assert.Equal(
            reservationId,
            saved.GetProperty("id").GetGuid());

        Assert.Equal(
            candidate.RestaurantId,
            saved.GetProperty("restaurantId").GetInt32());

        Assert.Equal(
            candidate.TableGroupId,
            saved.GetProperty("tableGroupId").GetInt32());

        Assert.Equal(
            guestNumber,
            saved.GetProperty("guestNumber").GetInt32());

        // 6. Wait for reservation confirmation mail
        var emailMessage = await WaitForMailAsync(
            session.Email,
            "Reservation confirmed",
            TimeSpan.FromSeconds(15));

        Assert.NotNull(emailMessage);
        Assert.Equal("Reservation confirmed", emailMessage.Subject);

        Assert.Contains(
            emailMessage.To,
            address => address.Address.Equals(
                session.Email,
                StringComparison.OrdinalIgnoreCase));
    }


    [Fact]
    public async Task UserCanCreateFoodReservationPayWithStripeAndReceiveReceiptEmail()
    {
        const int guestNumber = 2;
        const int restaurantId = 20;

        // 1. Register, confirm, login
        var session = await RegisterConfirmAndLoginAsync();

        _reservationsClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);

        // 2. Get restaurant info
        var infoResponse = await _restaurantsClient.GetAsync(
            $"/api/Restaurants/GetRestaurantInfo/{restaurantId}");

        Assert.True(
            infoResponse.IsSuccessStatusCode,
            $"Restaurant info failed: {(int)infoResponse.StatusCode}");

        var info = await infoResponse.Content
            .ReadFromJsonAsync<GetRestaurantInfoResponse>();

        Assert.NotNull(info);
        Assert.NotEmpty(info.TableGroups);

        // 3. Get real menu item from Restaurants service
        var menuResponse = await _restaurantsClient.GetAsync(
            $"/api/Restaurants/GetMenuItemsForRestaurant/{restaurantId}");

        Assert.True(
            menuResponse.IsSuccessStatusCode,
            $"Menu request failed: {(int)menuResponse.StatusCode}");

        var menu = await menuResponse.Content
            .ReadFromJsonAsync<List<MenuItemResponse>>();

        Assert.NotNull(menu);
        Assert.NotEmpty(menu);

        var menuItem = menu[0];

        Assert.True(menuItem.MenuItemId > 0);
        Assert.False(string.IsNullOrWhiteSpace(menuItem.FoodName));
        Assert.True(menuItem.Price > 0);

        // 4. Find real available slot/table
        ReservationCandidate? candidate = null;

        for (var dayOffset = 1;
             dayOffset <= 7 && candidate == null;
             dayOffset++)
        {
            var date = DateOnly.FromDateTime(
                DateTime.UtcNow.AddDays(dayOffset));

            var slotsResponse = await _reservationsClient.GetAsync(
                $"/api/reservations/availability/slots" +
                $"?restaurantId={restaurantId}" +
                $"&date={date:yyyy-MM-dd}" +
                $"&guestNumber={guestNumber}");

            if (!slotsResponse.IsSuccessStatusCode)
                continue;

            var slots = await slotsResponse.Content
                .ReadFromJsonAsync<List<AvailableSlotResponse>>();

            if (slots == null || slots.Count == 0)
                continue;

            foreach (var slot in slots)
            {
                var time = slot.Time.ToString("HH:mm:ss");

                var tablesResponse = await _reservationsClient.GetAsync(
                    $"/api/reservations/availability/tables" +
                    $"?restaurantId={restaurantId}" +
                    $"&date={date:yyyy-MM-dd}" +
                    $"&time={time}" +
                    $"&guestNumber={guestNumber}");

                if (!tablesResponse.IsSuccessStatusCode)
                    continue;

                var tables = await tablesResponse.Content
                    .ReadFromJsonAsync<List<AvailableTableResponse>>();

                var table = tables?.FirstOrDefault(t =>
                    t.Capacity >= guestNumber &&
                    t.AvailableTables > 0);

                if (table == null)
                    continue;

                candidate = new ReservationCandidate(
                    restaurantId,
                    "Restaurant 20",
                    table.TableGroupId,
                    date,
                    slot.Time);

                break;
            }
        }

        Assert.NotNull(candidate);

        // 5. Create reservation WITH food
        var createResponse = await _reservationsClient.PostAsJsonAsync(
            "/api/reservations",
            new
            {
                restaurantId,
                tableGroupId = candidate.TableGroupId,
                date = candidate.Date.ToString("yyyy-MM-dd"),
                startTime = candidate.Time.ToString("HH:mm:ss"),
                guestNumber,
                orders = new[]
                {
                    new
                    {
                        menuItemId = menuItem.MenuItemId,
                        quantity = 1
                    }
                },
                servingTime = candidate.Time.ToString("HH:mm:ss")
            });

        var createBody = await createResponse.Content.ReadAsStringAsync();

        Assert.True(
            createResponse.StatusCode == HttpStatusCode.Created,
            $"Create failed {(int)createResponse.StatusCode}: {createBody}");

        using var createdJson = JsonDocument.Parse(createBody);
        var created = createdJson.RootElement;

        var reservationId = created.GetProperty("id").GetGuid();

        Assert.NotEqual(Guid.Empty, reservationId);

        Assert.Equal(
            1,
            created.GetProperty("orders").GetArrayLength());

        Assert.Equal(
            menuItem.Price,
            created.GetProperty("totalAmount").GetDecimal());

        Assert.Equal(
            "NotStarted",
            created.GetProperty("paymentStatus").GetString());

        var createdOrder = created
            .GetProperty("orders")[0];

        Assert.Equal(
            menuItem.MenuItemId,
            createdOrder.GetProperty("menuItemId").GetInt32());

        Assert.Equal(
            menuItem.FoodName,
            createdOrder.GetProperty("foodName").GetString());

        Assert.Equal(
            1,
            createdOrder.GetProperty("quantity").GetInt32());

        // Food reservation must NOT send confirmation before payment succeeds
        var prematureConfirmation = await WaitForMailAsync(
            session.Email,
            "Reservation confirmed",
            TimeSpan.FromSeconds(2));

        Assert.Null(prematureConfirmation);

        // 6. Start payment
        // Reservations -> Payment gRPC -> Stripe PaymentIntent
        var paymentResponse = await _reservationsClient.PostAsync(
            $"/api/reservations/{reservationId}/payment",
            null);

        var paymentBody = await paymentResponse.Content.ReadAsStringAsync();

        Assert.True(
            paymentResponse.IsSuccessStatusCode,
            $"Start payment failed {(int)paymentResponse.StatusCode}: " +
            paymentBody);

        using var paymentJson = JsonDocument.Parse(paymentBody);
        var payment = paymentJson.RootElement;

        Assert.Equal(
            reservationId,
            payment.GetProperty("reservationId").GetGuid());

        Assert.Equal(
            "Pending",
            payment.GetProperty("paymentStatus").GetString());

        var clientSecret =
            payment.GetProperty("clientSecret").GetString();

        Assert.False(string.IsNullOrWhiteSpace(clientSecret));
        Assert.StartsWith("pi_", clientSecret);

        var paymentIntentId = clientSecret!
            .Split("_secret_", StringSplitOptions.None)[0];

        Assert.StartsWith("pi_", paymentIntentId);

        // 7. Verify Reservations persisted Pending state
        var pendingResponse = await _reservationsClient.GetAsync(
            $"/api/reservations/{reservationId}");

        var pendingBody =
            await pendingResponse.Content.ReadAsStringAsync();

        Assert.True(
            pendingResponse.IsSuccessStatusCode,
            $"Get pending reservation failed " +
            $"{(int)pendingResponse.StatusCode}: {pendingBody}");

        using (var pendingJson = JsonDocument.Parse(pendingBody))
        {
            var pending = pendingJson.RootElement;

            Assert.Equal(
                reservationId,
                pending.GetProperty("id").GetGuid());

            Assert.Equal(
                "Pending",
                pending.GetProperty("paymentStatus").GetString());
        }

        // 8. Confirm REAL Stripe payment using Stripe test payment method
        var stripePayment =
            await ConfirmStripePaymentAsync(paymentIntentId);

        Assert.Equal("succeeded", stripePayment.Status);

        Assert.False(
            string.IsNullOrWhiteSpace(stripePayment.ReceiptUrl));

        Assert.True(
            Uri.TryCreate(
                stripePayment.ReceiptUrl,
                UriKind.Absolute,
                out var receiptUri));

        Assert.Equal(
            Uri.UriSchemeHttps,
            receiptUri!.Scheme);

        // 9. Wait:
        // Stripe
        // -> stripe-listener
        // -> Payment webhook
        // -> RabbitMQ
        // -> Reservations
        var succeeded = await WaitForPaymentStatusAsync(
            reservationId,
            "Succeeded",
            TimeSpan.FromSeconds(45));

        Assert.True(
            succeeded,
            "Reservation payment did not become Succeeded " +
            "after Stripe payment confirmation.");

        // 10. Verify final Reservations state
        var finalResponse = await _reservationsClient.GetAsync(
            $"/api/reservations/{reservationId}");

        var finalBody =
            await finalResponse.Content.ReadAsStringAsync();

        Assert.True(
            finalResponse.IsSuccessStatusCode,
            $"Get final reservation failed " +
            $"{(int)finalResponse.StatusCode}: {finalBody}");

        using (var finalJson = JsonDocument.Parse(finalBody))
        {
            var finalReservation = finalJson.RootElement;

            Assert.Equal(
                reservationId,
                finalReservation.GetProperty("id").GetGuid());

            Assert.Equal(
                "Succeeded",
                finalReservation
                    .GetProperty("paymentStatus")
                    .GetString());

            Assert.Equal(
                1,
                finalReservation
                    .GetProperty("orders")
                    .GetArrayLength());

            Assert.Equal(
                menuItem.FoodName,
                finalReservation
                    .GetProperty("orders")[0]
                    .GetProperty("foodName")
                    .GetString());
        }

        // 11. Wait for confirmation email AFTER successful payment
        var paidMail = await WaitForMailAsync(
            session.Email,
            "Reservation confirmed",
            TimeSpan.FromSeconds(45));

        Assert.NotNull(paidMail);

        Assert.Contains(
            paidMail.To,
            address => address.Address.Equals(
                session.Email,
                StringComparison.OrdinalIgnoreCase));

        // 12. Read actual Mailpit HTML
        var mailHtml =
            await GetMailHtmlAsync(paidMail.ID);

        var decodedMailHtml =
            WebUtility.HtmlDecode(mailHtml);

        // Email must contain reservation data
        Assert.Contains(
            reservationId.ToString(),
            decodedMailHtml,
            StringComparison.OrdinalIgnoreCase);

        Assert.Contains(
            menuItem.FoodName,
            decodedMailHtml,
            StringComparison.OrdinalIgnoreCase);

        // 13. The real Stripe receipt URL must be present in the email.
        Assert.DoesNotContain(
            "{{ receipt_url }}",
            decodedMailHtml,
            StringComparison.OrdinalIgnoreCase);

        Assert.Contains(
            "https://pay.stripe.com/receipts/payment/",
            decodedMailHtml,
            StringComparison.OrdinalIgnoreCase);
    }
    
    [Fact]
    public async Task UserCanCancelPaidReservationReceiveStripeRefundAndRefundEmails()
    {
        const int guestNumber = 2;
        const int restaurantId = 20;

        // 1. Register, confirm, login
        var session = await RegisterConfirmAndLoginAsync();

        _reservationsClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", session.AccessToken);

        // 2. Get menu item
        var menuResponse = await _restaurantsClient.GetAsync(
            $"/api/Restaurants/GetMenuItemsForRestaurant/{restaurantId}");

        Assert.True(menuResponse.IsSuccessStatusCode);

        var menu = await menuResponse.Content
            .ReadFromJsonAsync<List<MenuItemResponse>>();

        Assert.NotNull(menu);
        Assert.NotEmpty(menu);

        var menuItem = menu[0];

        // 3. Find available slot/table
        ReservationCandidate? candidate = null;

        for (var dayOffset = 1;
             dayOffset <= 7 && candidate == null;
             dayOffset++)
        {
            var date = DateOnly.FromDateTime(
                DateTime.UtcNow.AddDays(dayOffset));

            var slotsResponse = await _reservationsClient.GetAsync(
                $"/api/reservations/availability/slots" +
                $"?restaurantId={restaurantId}" +
                $"&date={date:yyyy-MM-dd}" +
                $"&guestNumber={guestNumber}");

            if (!slotsResponse.IsSuccessStatusCode)
                continue;

            var slots = await slotsResponse.Content
                .ReadFromJsonAsync<List<AvailableSlotResponse>>();

            if (slots == null || slots.Count == 0)
                continue;

            foreach (var slot in slots)
            {
                var time = slot.Time.ToString("HH:mm:ss");

                var tablesResponse = await _reservationsClient.GetAsync(
                    $"/api/reservations/availability/tables" +
                    $"?restaurantId={restaurantId}" +
                    $"&date={date:yyyy-MM-dd}" +
                    $"&time={time}" +
                    $"&guestNumber={guestNumber}");

                if (!tablesResponse.IsSuccessStatusCode)
                    continue;

                var tables = await tablesResponse.Content
                    .ReadFromJsonAsync<List<AvailableTableResponse>>();

                var table = tables?.FirstOrDefault(t =>
                    t.Capacity >= guestNumber &&
                    t.AvailableTables > 0);

                if (table == null)
                    continue;

                candidate = new ReservationCandidate(
                    restaurantId,
                    "Restaurant 20",
                    table.TableGroupId,
                    date,
                    slot.Time);

                break;
            }
        }

        Assert.NotNull(candidate);

        // 4. Create food reservation
        var createResponse = await _reservationsClient.PostAsJsonAsync(
            "/api/reservations",
            new
            {
                restaurantId,
                tableGroupId = candidate.TableGroupId,
                date = candidate.Date.ToString("yyyy-MM-dd"),
                startTime = candidate.Time.ToString("HH:mm:ss"),
                guestNumber,
                orders = new[]
                {
                    new
                    {
                        menuItemId = menuItem.MenuItemId,
                        quantity = 1
                    }
                },
                servingTime = candidate.Time.ToString("HH:mm:ss")
            });

        var createBody =
            await createResponse.Content.ReadAsStringAsync();

        Assert.True(
            createResponse.StatusCode == HttpStatusCode.Created,
            $"Create failed {(int)createResponse.StatusCode}: {createBody}");

        using var createJson =
            JsonDocument.Parse(createBody);

        var reservationId =
            createJson.RootElement
                .GetProperty("id")
                .GetGuid();

        Assert.NotEqual(Guid.Empty, reservationId);

        // 5. Start payment
        var paymentResponse = await _reservationsClient.PostAsync(
            $"/api/reservations/{reservationId}/payment",
            null);

        var paymentBody =
            await paymentResponse.Content.ReadAsStringAsync();

        Assert.True(
            paymentResponse.IsSuccessStatusCode,
            $"Start payment failed {(int)paymentResponse.StatusCode}: {paymentBody}");

        using var paymentJson =
            JsonDocument.Parse(paymentBody);

        var clientSecret =
            paymentJson.RootElement
                .GetProperty("clientSecret")
                .GetString();

        Assert.False(
            string.IsNullOrWhiteSpace(clientSecret));

        var paymentIntentId = clientSecret!
            .Split("_secret_", StringSplitOptions.None)[0];

        // 6. Pay with REAL Stripe test payment
        var stripePayment =
            await ConfirmStripePaymentAsync(paymentIntentId);

        Assert.Equal(
            "succeeded",
            stripePayment.Status);

        // 7. Wait until Reservations receives PaymentSucceeded
        var paymentSucceeded =
            await WaitForPaymentStatusAsync(
                reservationId,
                "Succeeded",
                TimeSpan.FromSeconds(45));

        Assert.True(
            paymentSucceeded,
            "Reservation never became Succeeded.");

        // 8. We should have paid confirmation before cancellation
        var confirmationMail =
            await WaitForMailAsync(
                session.Email,
                "Reservation confirmed",
                TimeSpan.FromSeconds(30));

        Assert.NotNull(confirmationMail);

        // 9. CANCEL reservation
        // Reservations -> Payment -> Stripe refund
        var cancelResponse =
            await _reservationsClient.DeleteAsync(
                $"/api/reservations/{reservationId}");

        var cancelBody =
            await cancelResponse.Content.ReadAsStringAsync();

        Assert.True(
            cancelResponse.StatusCode == HttpStatusCode.NoContent,
            $"Cancel failed {(int)cancelResponse.StatusCode}: {cancelBody}");

        // 10. Reservation itself must become Cancelled
        var cancelled =
            await WaitForReservationStateAsync(
                reservationId,
                "Cancelled",
                null,
                TimeSpan.FromSeconds(15));

        Assert.True(
            cancelled,
            "Reservation never became Cancelled.");

        // 11. Verify Stripe actually refunded the charge
        var stripeRefunded =
            await WaitForStripeRefundAsync(
                stripePayment.ChargeId,
                TimeSpan.FromSeconds(45));

        Assert.True(
            stripeRefunded,
            "Stripe charge was not refunded.");

        // 12. Wait for webhook -> Payment -> RabbitMQ -> Reservations
        var reservationRefunded =
            await WaitForReservationStateAsync(
                reservationId,
                "Cancelled",
                "Refunded",
                TimeSpan.FromSeconds(45));

        Assert.True(
            reservationRefunded,
            "Reservation payment never became Refunded.");

        // 13. Cancellation email
        var cancelledMail =
            await WaitForMailSubjectContainingAsync(
                session.Email,
                "cancel",
                TimeSpan.FromSeconds(30));

        Assert.NotNull(cancelledMail);

        var cancelledHtml =
            WebUtility.HtmlDecode(
                await GetMailHtmlAsync(cancelledMail.ID));

        Assert.Contains(
            reservationId.ToString(),
            cancelledHtml,
            StringComparison.OrdinalIgnoreCase);

        // Paid reservation cancellation should mention refund
        Assert.Contains(
            "refund",
            cancelledHtml,
            StringComparison.OrdinalIgnoreCase);

        // 14. Final refund email
        var refundedMail =
            await WaitForMailSubjectContainingAsync(
                session.Email,
                "refund",
                TimeSpan.FromSeconds(45));

        Assert.NotNull(refundedMail);

        var refundedHtml =
            WebUtility.HtmlDecode(
                await GetMailHtmlAsync(refundedMail.ID));

        Assert.Contains(
            reservationId.ToString(),
            refundedHtml,
            StringComparison.OrdinalIgnoreCase);

        Assert.Contains(
            "refund",
            refundedHtml,
            StringComparison.OrdinalIgnoreCase);

        // Refund email must contain a valid Stripe receipt link.
        Assert.DoesNotContain(
            "{{ receipt_url }}",
            refundedHtml,
            StringComparison.OrdinalIgnoreCase);

        Assert.Contains(
            "https://pay.stripe.com/receipts/payment/",
            refundedHtml,
            StringComparison.OrdinalIgnoreCase);
    }


    private async Task<AuthSession> RegisterConfirmAndLoginAsync()
    {
        var email =
            $"e2e.{Guid.NewGuid():N}@example.com";

        const string password = "E2ePassword123!";

        var registerResponse = await SendWithRateLimitRetryAsync(() =>
            _identityClient.PostAsJsonAsync(
                "/api/auth/register",
                new
                {
                    fullName = "E2E Reservation User",
                    email,
                    phone = "+381601234567",
                    password
                }));

        Assert.Equal(
            HttpStatusCode.OK,
            registerResponse.StatusCode);

        var registration = await registerResponse.Content
            .ReadFromJsonAsync<RegisterResponse>();

        Assert.NotNull(registration);
        Assert.NotNull(registration.Dev);

        Assert.False(
            string.IsNullOrWhiteSpace(
                registration.Dev.UserId));

        Assert.False(
            string.IsNullOrWhiteSpace(
                registration.Dev.Token));

        var confirmResponse = await SendWithRateLimitRetryAsync(() =>
            _identityClient.PostAsJsonAsync(
                "/api/auth/confirm-email",
                new
                {
                    userId = registration.Dev.UserId,
                    token = registration.Dev.Token
                }));

        var confirmBody =
            await confirmResponse.Content.ReadAsStringAsync();

        Assert.True(
            confirmResponse.IsSuccessStatusCode,
            $"Confirm email failed " +
            $"{(int)confirmResponse.StatusCode}: {confirmBody}");

        var loginResponse = await SendWithRateLimitRetryAsync(() =>
            _identityClient.PostAsJsonAsync(
                "/api/auth/login",
                new
                {
                    email,
                    password
                }));

        var loginBody =
            await loginResponse.Content.ReadAsStringAsync();

        Assert.True(
            loginResponse.IsSuccessStatusCode,
            $"Login failed " +
            $"{(int)loginResponse.StatusCode}: {loginBody}");

        var auth = await loginResponse.Content
            .ReadFromJsonAsync<AuthResponse>();

        Assert.NotNull(auth);

        Assert.False(
            string.IsNullOrWhiteSpace(auth.AccessToken));

        return new AuthSession(
            email,
            auth.AccessToken);
    }


    private async Task<StripePaymentResult> ConfirmStripePaymentAsync(string paymentIntentId)
    {
        var secretKey = GetStripeSecretKey();

        Assert.False(
            string.IsNullOrWhiteSpace(secretKey),
            "PAYMENT_STRIPE_SECRET_KEY is not available to the E2E test. " +
            "Load it from the payment-api container before running tests.");

        using var stripeClient = new HttpClient
        {
            BaseAddress = new Uri("https://api.stripe.com")
        };

        stripeClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                secretKey);

        using var content = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["payment_method"] = "pm_card_visa",
                ["return_url"] = "http://localhost:3000/payment-complete",
                ["expand[]"] = "latest_charge"
            });

        var response = await stripeClient.PostAsync(
            $"/v1/payment_intents/{paymentIntentId}/confirm",
            content);

        var body =
            await response.Content.ReadAsStringAsync();

        Assert.True(
            response.IsSuccessStatusCode,
            $"Stripe confirmation failed " +
            $"{(int)response.StatusCode}: {body}");

        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        var status =
            root.GetProperty("status").GetString();

        Assert.Equal("succeeded", status);

        string? chargeId = null;
        string? receiptUrl = null;

        if (root.TryGetProperty(
                "latest_charge",
                out var latestCharge))
        {
            if (latestCharge.ValueKind ==
                JsonValueKind.String)
            {
                chargeId =
                    latestCharge.GetString();
            }
            else if (latestCharge.ValueKind ==
                     JsonValueKind.Object)
            {
                if (latestCharge.TryGetProperty(
                        "id",
                        out var chargeIdElement))
                {
                    chargeId =
                        chargeIdElement.GetString();
                }

                if (latestCharge.TryGetProperty(
                        "receipt_url",
                        out var receiptElement) &&
                    receiptElement.ValueKind ==
                    JsonValueKind.String)
                {
                    receiptUrl =
                        receiptElement.GetString();
                }
            }
        }

        if (string.IsNullOrWhiteSpace(receiptUrl) &&
            !string.IsNullOrWhiteSpace(chargeId))
        {
            receiptUrl =
                await GetStripeReceiptUrlAsync(
                    stripeClient,
                    chargeId);
        }

        Assert.False(
            string.IsNullOrWhiteSpace(chargeId),
            $"Stripe PaymentIntent {paymentIntentId} " +
            "did not contain latest_charge.");

        Assert.False(
            string.IsNullOrWhiteSpace(receiptUrl),
            $"Stripe charge {chargeId} did not contain receipt_url.");

        return new StripePaymentResult(
            paymentIntentId,
            chargeId!,
            status!,
            receiptUrl!);
    }


    private static async Task<string?> GetStripeReceiptUrlAsync(
            HttpClient stripeClient,
            string chargeId)
    {
        var response = await stripeClient.GetAsync(
            $"/v1/charges/{chargeId}");

        var body =
            await response.Content.ReadAsStringAsync();

        Assert.True(
            response.IsSuccessStatusCode,
            $"Stripe charge request failed " +
            $"{(int)response.StatusCode}: {body}");

        using var json =
            JsonDocument.Parse(body);

        var root =
            json.RootElement;

        if (!root.TryGetProperty(
                "receipt_url",
                out var receiptElement))
            return null;

        return receiptElement.ValueKind ==
               JsonValueKind.String
            ? receiptElement.GetString()
            : null;
    }


    private async Task<bool> WaitForPaymentStatusAsync(
            Guid reservationId,
            string expectedStatus,
            TimeSpan timeout)
    {
        var deadline =
            DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            var response =
                await _reservationsClient.GetAsync(
                    $"/api/reservations/{reservationId}");

            if (response.IsSuccessStatusCode)
            {
                var body =
                    await response.Content.ReadAsStringAsync();

                using var json =
                    JsonDocument.Parse(body);

                if (json.RootElement.TryGetProperty(
                        "paymentStatus",
                        out var statusElement) &&
                    statusElement.ValueKind ==
                    JsonValueKind.String &&
                    string.Equals(
                        statusElement.GetString(),
                        expectedStatus,
                        StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            await Task.Delay(500);
        }

        return false;
    }


    private async Task<MailpitMessage?> WaitForMailAsync(
            string email,
            string subject,
            TimeSpan timeout)
    {
        var deadline =
            DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            var response = await _mailpitClient.GetAsync(
                "/api/v1/messages?start=0&limit=100");

            if (response.IsSuccessStatusCode)
            {
                var mailbox = await response.Content
                    .ReadFromJsonAsync<MailpitMessagesResponse>();

                var message =
                    mailbox?.Messages.FirstOrDefault(m =>
                        m.Subject == subject &&
                        m.To.Any(a =>
                            a.Address.Equals(
                                email,
                                StringComparison.OrdinalIgnoreCase)));

                if (message != null)
                    return message;
            }

            await Task.Delay(500);
        }

        return null;
    }


    private async Task<string> GetMailHtmlAsync(string messageId)
    {
        var response = await _mailpitClient.GetAsync(
            $"/view/{Uri.EscapeDataString(messageId)}.html");

        var body =
            await response.Content.ReadAsStringAsync();

        Assert.True(
            response.IsSuccessStatusCode,
            $"Mailpit HTML request failed " +
            $"{(int)response.StatusCode}: {body}");

        Assert.False(
            string.IsNullOrWhiteSpace(body));

        return body;
    }
    
    private static string GetStripeSecretKey()
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "docker",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        startInfo.ArgumentList.Add("compose");
        startInfo.ArgumentList.Add("exec");
        startInfo.ArgumentList.Add("-T");
        startInfo.ArgumentList.Add("payment-api");
        startInfo.ArgumentList.Add("printenv");
        startInfo.ArgumentList.Add("PAYMENT_STRIPE_SECRET_KEY");

        using var process = Process.Start(startInfo)
                            ?? throw new InvalidOperationException(
                                "Could not start Docker process.");

        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();

        process.WaitForExit();

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Could not read PAYMENT_STRIPE_SECRET_KEY from payment-api container. {error}");
        }

        var stripeSecretKey = output.Trim();

        if (string.IsNullOrWhiteSpace(stripeSecretKey))
        {
            throw new InvalidOperationException(
                "PAYMENT_STRIPE_SECRET_KEY is empty in payment-api container.");
        }

        return stripeSecretKey;
    }
    
    private async Task<bool> WaitForReservationStateAsync(
        Guid reservationId,
        string expectedReservationStatus,
        string? expectedPaymentStatus,
        TimeSpan timeout)
    {
        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            var response = await _reservationsClient.GetAsync(
                $"/api/reservations/{reservationId}");

            if (response.IsSuccessStatusCode)
            {
                var body =
                    await response.Content.ReadAsStringAsync();

                using var json =
                    JsonDocument.Parse(body);

                var root = json.RootElement;

                var reservationStatus =
                    root.GetProperty("status").GetString();

                var paymentStatus =
                    root.GetProperty("paymentStatus").GetString();

                var reservationMatches =
                    string.Equals(
                        reservationStatus,
                        expectedReservationStatus,
                        StringComparison.OrdinalIgnoreCase);

                var paymentMatches =
                    expectedPaymentStatus == null ||
                    string.Equals(
                        paymentStatus,
                        expectedPaymentStatus,
                        StringComparison.OrdinalIgnoreCase);

                if (reservationMatches && paymentMatches)
                    return true;
            }

            await Task.Delay(500);
        }

        return false;
    }


    private async Task<bool> WaitForStripeRefundAsync(
        string chargeId,
        TimeSpan timeout)
    {
        var secretKey = GetStripeSecretKey();

        Assert.False(
            string.IsNullOrWhiteSpace(secretKey),
            "PAYMENT_STRIPE_SECRET_KEY could not be read from payment-api.");

        using var stripeClient = new HttpClient
        {
            BaseAddress = new Uri("https://api.stripe.com")
        };

        stripeClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                secretKey);

        var deadline = DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            var response = await stripeClient.GetAsync(
                $"/v1/charges/{chargeId}");

            if (response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync();

                using var json = JsonDocument.Parse(body);
                var root = json.RootElement;

                var refunded =
                    root.TryGetProperty("refunded", out var refundedElement) &&
                    refundedElement.GetBoolean();

                var amountRefunded =
                    root.TryGetProperty("amount_refunded", out var amountElement)
                        ? amountElement.GetInt64()
                        : 0;

                if (refunded || amountRefunded > 0)
                    return true;
            }

            await Task.Delay(500);
        }

        return false;
    }


    private async Task<MailpitMessage?> WaitForMailSubjectContainingAsync(
            string email,
            string subjectPart,
            TimeSpan timeout)
    {
        var deadline =
            DateTime.UtcNow + timeout;

        while (DateTime.UtcNow < deadline)
        {
            var response = await _mailpitClient.GetAsync(
                "/api/v1/messages?start=0&limit=100");

            if (response.IsSuccessStatusCode)
            {
                var mailbox = await response.Content
                    .ReadFromJsonAsync<MailpitMessagesResponse>();

                var message =
                    mailbox?.Messages.FirstOrDefault(m =>
                        m.Subject.Contains(
                            subjectPart,
                            StringComparison.OrdinalIgnoreCase) &&
                        m.To.Any(a =>
                            a.Address.Equals(
                                email,
                                StringComparison.OrdinalIgnoreCase)));

                if (message != null)
                    return message;
            }

            await Task.Delay(500);
        }

        return null;
    }

    private class RegisterResponse
    {
        public string Message { get; set; } = string.Empty;
        public DevelopmentRegistrationData Dev { get; set; } =
            new();
    }
    
    private static async Task<HttpResponseMessage> SendWithRateLimitRetryAsync(
        Func<Task<HttpResponseMessage>> send)
    {
        const int maxAttempts = 10;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            var response = await send();

            if (response.StatusCode != HttpStatusCode.TooManyRequests)
                return response;

            if (attempt == maxAttempts)
                return response;

            var delay =
                response.Headers.RetryAfter?.Delta ??
                TimeSpan.FromSeconds(5);

            response.Dispose();

            await Task.Delay(delay);
        }

        throw new InvalidOperationException(
            "Unexpected rate-limit retry state.");
    }


    private class DevelopmentRegistrationData
    {
        public string UserId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
    }


    private class AuthResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public DateTime ExpiresAtUtc { get; set; }
        public string RefreshToken { get; set; } = string.Empty;
    }


    private class GetRestaurantsResponse
    {
        public List<RestaurantResponse> Items { get; set; } = [];
    }


    private class RestaurantResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }


    private class GetRestaurantInfoResponse
    {
        public List<TableGroupResponse> TableGroups { get; set; } = [];
    }


    private class TableGroupResponse
    {
        public int Id { get; set; }
        public int Capacity { get; set; }
        public int TableCount { get; set; }
    }


    private class AvailableSlotResponse
    {
        public TimeOnly Time { get; set; }
    }


    private class AvailableTableResponse
    {
        public int TableGroupId { get; set; }
        public string Location { get; set; } = string.Empty;
        public int Capacity { get; set; }
        public int AvailableTables { get; set; }
    }


    private class MenuItemResponse
    {
        public int MenuItemId { get; set; }
        public string FoodName { get; set; } = string.Empty;
        public decimal Price { get; set; }
    }


    private class MailpitMessagesResponse
    {
        public List<MailpitMessage> Messages { get; set; } = [];
    }


    private class MailpitMessage
    {
        public string ID { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public List<MailpitAddress> To { get; set; } = [];
    }


    private class MailpitAddress
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }


    private record ReservationCandidate(
        int RestaurantId,
        string RestaurantName,
        int TableGroupId,
        DateOnly Date,
        TimeOnly Time);


    private record AuthSession(
        string Email,
        string AccessToken);


    private record StripePaymentResult(
        string PaymentIntentId,
        string ChargeId,
        string Status,
        string ReceiptUrl);
}