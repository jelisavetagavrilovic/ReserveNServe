# Class Diagrams

These diagrams focus on the main classes and dependencies that explain each subsystem. Key members are shown for primary interfaces, domain entities, and integration contracts. Controllers, DbContext classes, and concrete adapters are represented by their names and relationships to keep the diagrams readable. DTO-only and framework-generated types are omitted.

[Identity](#identity-subsystem) · [Restaurants](#restaurants-subsystem) · [Reservations](#reservations-subsystem) · [Payment](#payment-subsystem) · [Notifications](#notifications-subsystem) · [Frontend](#frontend-subsystem) · [Contracts](#shared-integration-contracts)

## Identity subsystem

```mermaid
classDiagram
    direction TB
    class AuthController
    class OwnerRequestController
    class IAuthApplicationService {
        <<interface>>
        RegisterAsync()
        LoginAsync()
        RefreshAsync()
        UpdateProfileAsync()
    }
    class AuthApplicationService
    class IOwnerRequestApplicationService {
        <<interface>>
        RequestRestaurantOwnerAsync()
        GetPendingOwnerRequestsAsync()
        ApproveRestaurantOwnerAsync()
    }
    class OwnerRequestApplicationService
    class ITokenService {
        <<interface>>
        CreateAccessTokenAsync()
        CreateRefreshTokenAsync()
        RevokeRefreshTokenAsync()
    }
    class TokenService
    class ApplicationUser {
        FullName
        OwnerRequestPending
        RefreshTokens
    }
    class RefreshToken {
        TokenHash
        ExpiresAtUtc
        RevokedAtUtc
    }

    AuthController --> IAuthApplicationService
    IAuthApplicationService <|.. AuthApplicationService
    OwnerRequestController --> IOwnerRequestApplicationService
    IOwnerRequestApplicationService <|.. OwnerRequestApplicationService
    AuthApplicationService --> ITokenService
    ITokenService <|.. TokenService
    AuthApplicationService --> ApplicationUser
    OwnerRequestApplicationService --> ApplicationUser
    ApplicationUser "1" *-- "many" RefreshToken
```

`AuthApplicationService` publishes registration and password-reset events. `OwnerRequestApplicationService` handles restaurant-owner requests and publishes `OwnerRequestApproved`.

## Restaurants subsystem

```mermaid
classDiagram
    direction TB
    class RestaurantsController
    class RestaurantsHandler
    class IRestaurantsRepository {
        <<interface>>
        GetRestaurantsAsync()
        GetRestaurantByIdAsync()
        GetMenuItemsAsync()
        GetTablesForRestaurantAsync()
    }
    class RestaurantRepository
    class RestaurantsContext
    class RestaurantsGrpcService
    class Restaurant {
        id
        name
        city
        opening_time
        closing_time
        rating
        cuisine_type
    }
    class Table {
        id
        restaurant_id
        location
        seats
        total_table_number
    }
    class MenuItem {
        id
        restaurant_id
        food_name
        price
        category
    }
    class Cuisines {
        id
        cuisine_type
    }

    RestaurantsController --> RestaurantsHandler
    RestaurantsGrpcService --> RestaurantsHandler
    RestaurantsHandler --> IRestaurantsRepository
    IRestaurantsRepository <|.. RestaurantRepository
    RestaurantRepository --> RestaurantsContext
    RestaurantsContext --> Restaurant
    RestaurantsContext --> Table
    RestaurantsContext --> MenuItem
    RestaurantsContext --> Cuisines
    Restaurant "1" --> "many" Table : restaurant_id
    Restaurant "1" --> "many" MenuItem : restaurant_id
    Restaurant --> Cuisines : cuisine_type
```

The REST controller and gRPC service share the same handler/repository boundary. Table and menu relationships are represented by IDs in the current entities.

## Reservations subsystem

```mermaid
classDiagram
    direction TB
    class ReservationsController
    class IReservationService {
        <<interface>>
        CreateReservationAsync()
        GetAvailableSlotsAsync()
        StartPaymentAsync()
        CancelReservationAsync()
        HandlePaymentStatusUpdateAsync()
    }
    class ReservationService
    class IReservationRepository {
        <<interface>>
        GetByIdAsync()
        GetForUserAsync()
        AddAsync()
        UpdateAsync()
        CountActiveReservationsAsync()
    }
    class ReservationRepository
    class ReservationsDbContext
    class IRestaurantClient {
        <<interface>>
        GetRestaurantInfoAsync()
        GetMenuItemsAsync()
    }
    class RestaurantClient
    class IPaymentClient {
        <<interface>>
        CreatePaymentAsync()
        RefundPaymentAsync()
    }
    class PaymentClient
    class INotificationClient {
        <<interface>>
        SendReservationConfirmedAsync()
        SendReservationCancelledAsync()
        SendReservationRefundedAsync()
    }
    class NotificationClient
    class PaymentStatusChangedConsumer
    class Reservation {
        Id
        UserId
        RestaurantId
        Status
        PaymentStatus
        SetOrders()
        Cancel()
    }
    class Order {
        MenuItemId
        FoodName
        Price
        Quantity
    }

    ReservationsController --> IReservationService
    IReservationService <|.. ReservationService
    ReservationService --> IReservationRepository
    IReservationRepository <|.. ReservationRepository
    ReservationRepository --> ReservationsDbContext
    ReservationService --> IRestaurantClient
    IRestaurantClient <|.. RestaurantClient
    ReservationService --> IPaymentClient
    IPaymentClient <|.. PaymentClient
    ReservationService --> INotificationClient
    INotificationClient <|.. NotificationClient
    PaymentStatusChangedConsumer --> IReservationService
    Reservation "1" *-- "many" Order
    ReservationsDbContext --> Reservation
```

Reservations is structured as API, Application, Domain and Infrastructure projects. The domain aggregate enforces reservation and payment-state transitions, while the application service coordinates external clients.

## Payment subsystem

```mermaid
classDiagram
    direction TB
    class PaymentController
    class PaymentWebhookController
    class PaymentsGrpcService
    class PaymentsHandler
    class IPaymentsRepository {
        <<interface>>
        InsertNewPayment()
        GetPaymentByReservationId()
        GetPaymentByIntentIdAsync()
        UpdatePaymentStatus()
    }
    class PaymentsRepository
    class PaymentsContext
    class IStripePaymentService {
        <<interface>>
        GetPaymentIntentAsync()
        CreatePaymentIntentAsync()
        CreateRefund()
    }
    class StripePaymentService
    class IPaymentStatusPublisher {
        <<interface>>
        PublishAsync()
    }
    class RabbitMqPaymentStatusPublisher
    class Payment {
        id
        reservation_id
        payment_intent
        status
    }

    PaymentController --> PaymentsHandler
    PaymentController --> IStripePaymentService
    PaymentWebhookController --> PaymentsHandler
    PaymentsGrpcService --> PaymentsHandler
    PaymentsHandler --> IPaymentsRepository
    IPaymentsRepository <|.. PaymentsRepository
    PaymentsRepository --> PaymentsContext
    PaymentsContext --> Payment
    IStripePaymentService <|.. StripePaymentService
    PaymentsHandler --> IPaymentStatusPublisher
    IPaymentStatusPublisher <|.. RabbitMqPaymentStatusPublisher
```

`reservation_id` is the correlation key between Payment and Reservations. Stripe webhooks enter through `PaymentWebhookController` and `PaymentsHandler` converts provider events into logical statuses before publication.

## Notifications subsystem

```mermaid
classDiagram
    direction TB
    class UserRegisteredConsumer
    class ReservationConfirmedConsumer
    class ReservationRefundedConsumer
    class IEmailDispatcher {
        <<interface>>
        DispatchAsync()
    }
    class EmailDispatcher
    class IEmailTemplateRenderer {
        <<interface>>
        RenderAsync()
    }
    class ScribanTemplateRenderer
    class IEmailSender {
        <<interface>>
        SendAsync()
    }
    class SmtpEmailSender
    class NotificationsDbContext
    class EmailMessage {
        ToEmail
        TemplateName
        Status
        Attempts
        Error
    }

    UserRegisteredConsumer --> IEmailDispatcher
    ReservationConfirmedConsumer --> IEmailDispatcher
    ReservationRefundedConsumer --> IEmailDispatcher
    IEmailDispatcher <|.. EmailDispatcher
    EmailDispatcher --> IEmailTemplateRenderer
    IEmailTemplateRenderer <|.. ScribanTemplateRenderer
    EmailDispatcher --> IEmailSender
    IEmailSender <|.. SmtpEmailSender
    EmailDispatcher --> NotificationsDbContext
    NotificationsDbContext --> EmailMessage
```

`PasswordResetRequestedConsumer`, `OwnerRequestApprovedConsumer` and `ReservationCancelledConsumer` use the same dispatcher pipeline. The dispatcher creates an audit entry before delivery, then records `Sent` or `Failed`.

## Frontend subsystem

```mermaid
classDiagram
    direction TB
    class RestaurantPage {
        <<Next.js page>>
        selectAvailability()
        createBooking()
    }
    class MenuPage {
        <<Next.js page>>
        updateCart()
        continueToCheckout()
    }
    class CheckoutContent
    class PaymentComponent
    class RestaurantService {
        <<module>>
        getRestaurants()
        getAvailableSlots()
        getTablesByRestaurant()
    }
    class ReservationService {
        <<module>>
        createReservation()
        startReservationPayment()
        cancelReservation()
    }
    class PaymentApi {
        <<module>>
        reconcilePaymentStatus()
        reconcileRefundStatus()
    }
    class HttpClient {
        <<module>>
        apiRequest()
    }
    class AuthService {
        <<module>>
        login()
        refresh()
        logout()
    }
    class AuthStore {
        getSnapshot()
        hydrateFromStorage()
        setAuth()
        clear()
    }

    RestaurantPage --> RestaurantService
    RestaurantPage --> ReservationService
    RestaurantPage --> MenuPage
    MenuPage --> CheckoutContent
    CheckoutContent --> PaymentComponent
    PaymentComponent --> ReservationService
    PaymentComponent --> PaymentApi
    RestaurantService --> HttpClient
    ReservationService --> HttpClient
    PaymentApi --> ReservationService
    AuthService --> HttpClient
    AuthService --> AuthStore
```

The frontend separates low-level API modules from service exports and page/components. `AuthStore` persists the current authentication snapshot in browser local storage, and the shared HTTP client adds the current access token to requests. Refresh-token rotation is exposed by `AuthService` rather than performed automatically by the HTTP client.

## Shared integration contracts

```mermaid
classDiagram
    direction TB
    class UserRegistered {
        UserId
        Email
        ConfirmationToken
    }
    class PasswordResetRequested {
        UserId
        Email
        ResetToken
    }
    class OwnerRequestApproved {
        Email
        Approved
        Reason
    }
    class ReservationConfirmed {
        ReservationId
        Email
        TotalAmount
        Orders
    }
    class ReservationOrderItem {
        FoodName
        Price
        Quantity
        Total
    }
    class ReservationCancelled {
        ReservationId
        Email
        RefundExpected
        TotalAmount
    }
    class ReservationRefunded {
        ReservationId
        Email
        Amount
        ReceiptUrl
    }
    class NotificationsAPI

    ReservationConfirmed "1" *-- "many" ReservationOrderItem
    UserRegistered ..> NotificationsAPI : consumed by
    PasswordResetRequested ..> NotificationsAPI : consumed by
    OwnerRequestApproved ..> NotificationsAPI : consumed by
    ReservationConfirmed ..> NotificationsAPI : consumed by
    ReservationCancelled ..> NotificationsAPI : consumed by
    ReservationRefunded ..> NotificationsAPI : consumed by
```

The contracts package contains data-only records and remains independent of service persistence. This reduces coupling while keeping producer and consumer payloads consistent.
