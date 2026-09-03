# Reservations.API

Reservations.API is the core reservation-domain microservice of ReserveNServe. It manages reservation state, table availability, food pre-orders and coordination with restaurant and payment services.

## 1. Purpose

The service owns the reservation lifecycle. It combines restaurant reference data obtained from Restaurants.API with its own reservation records to determine available times and table groups.

## 2. Responsibilities

* Create and manage reservations
* Return reservations belonging to the current user
* Calculate available reservation times
* Calculate remaining tables by table-capacity group
* Store food pre-orders as reservation orders
* Validate menu items and prices through Restaurants.API
* Start card payments through Payment.API
* Request refunds when required during cancellation
* Consume asynchronous payment-status updates
* Publish reservation confirmation, cancellation and refund events
* Enforce reservation ownership using JWT claims

## 3. Project Structure

```text
Services/Reservations/
├── Reservations.API/
│   ├── Controllers/        # REST endpoints
│   ├── Middleware/         # Exception handling
│   └── Program.cs
├── Reservations.Application/
│   ├── DTOs/
│   ├── Interfaces/
│   └── Services/           # Reservation application logic
├── Reservations.Domain/
│   ├── Entities/           # Reservation and Order
│   └── ValueObjects/       # Reservation and payment statuses
├── Reservations.Infrastructure/
│   ├── Clients/            # Restaurants, Payment, and notifications
│   ├── DatabaseContext/    # ReservationsDbContext
│   ├── Messaging/          # Payment-status consumer
│   ├── Migrations/
│   ├── Protos/             # Restaurants and Payment gRPC contracts
│   └── Repositories/
└── Reservations.API.Tests/
```

## 4. Main Endpoints

| Method | Endpoint                                | Authorization | Purpose                                                  |
| ------ | --------------------------------------- | ------------- | -------------------------------------------------------- |
| POST   | `/api/reservations`                     | JWT           | Create a reservation                                     |
| GET    | `/api/reservations/{id}`                | JWT           | Get one owned reservation                                |
| GET    | `/api/reservations`                     | JWT           | Get paginated reservations belonging to the current user |
| PUT    | `/api/reservations/{id}`                | JWT           | Update reservation details                               |
| PUT    | `/api/reservations/{id}/orders`         | JWT           | Replace the food pre-order                               |
| POST   | `/api/reservations/{id}/payment`        | JWT           | Start or retry payment                                   |
| DELETE | `/api/reservations/{id}`                | JWT           | Cancel a reservation and request a refund when required  |
| GET    | `/api/reservations/availability/slots`  | Public        | Get available reservation times                          |
| GET    | `/api/reservations/availability/tables` | Public        | Get available table groups                               |

Authenticated operations read the user identifier from the JWT and verify reservation ownership.

Swagger is available in the Development environment at `https://localhost:7294/swagger`.

## 5. Database

Reservations.API uses **PostgreSQL** with **Entity Framework Core**.

The default database is:

```text
ReservationsDb
```

| Table          | Purpose                                                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Reservations` | Reservation owner, restaurant reference, table group, date, time, guest count, amount, reservation status, and payment status |
| `Orders`       | Snapshots of menu items included in a food pre-order                                                                          |

Each reservation can contain multiple orders:

```text
Reservation 1 ---- * Orders
```

Order records store:

* `ReservationId`
* `MenuItemId`
* `FoodName`
* `Price`
* `Quantity`

The service stores references to restaurant and menu data but does not duplicate the complete restaurant catalogue.

Entity Framework Core migrations are applied automatically when the service starts.

## 6. Configuration

| Setting                                                      | Purpose                                 |
| ------------------------------------------------------------ | --------------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`    | PostgreSQL connection                   |
| `GrpcServices__Restaurants`                                  | Restaurants.API gRPC address            |
| `GrpcServices__Payment`                                      | Payment.API gRPC address                |
| `RabbitMq__Host`, `RabbitMq__Username`, `RabbitMq__Password` | RabbitMQ connection                     |
| `Jwt__Issuer`, `Jwt__Audience`, `Jwt__Key`                   | JWT validation shared with Identity.API |
| `RESERVATIONS_HTTP_PORT`, `RESERVATIONS_HTTPS_PORT`          | Host ports used by Docker Compose       |

Internal Docker addresses are:

```text
PostgreSQL      : reservations-db:5432
Restaurants gRPC: http://restaurants-api:8082
Payment gRPC    : http://payment-api:8082
```

## 7. How to Run

Reservations.API depends on PostgreSQL, Restaurants.API, Payment.API, RabbitMQ and the SQL Server databases used by the connected services.

Configure the root `.env` file and development certificate as described in the [Setup and Run Guide](../../../../docs/setup-and-run.md).

From `backend/ReserveNServeBackend`, run:

```bash
docker compose up -d --build \
  sqlserver rabbitmq reservations-db \
  restaurants-db-init payment-db-init \
  restaurants-api payment-api reservations-api
```

For direct host development:

```bash
dotnet run --project Services/Reservations/Reservations.API/Reservations.API.csproj
```

PostgreSQL and the Restaurants.API and Payment.API gRPC ports are not published to the host by default. Additional port mappings may therefore be required for direct host execution.

## 8. Communication with Other Services

| Direction | Component         | Mechanism                 | Purpose                                                                     |
| --------- | ----------------- | ------------------------- | --------------------------------------------------------------------------- |
| Inbound   | Frontend          | REST/JSON with JWT        | Availability, reservation lifecycle, pre-orders and payment initialization |
| Outbound  | Restaurants.API   | gRPC                      | Opening hours, reservation duration, table groups, menu items and prices   |
| Outbound  | Payment.API       | gRPC                      | PaymentIntent creation and refund requests                                  |
| Inbound   | Payment.API       | RabbitMQ                  | Payment and refund status updates produced after Stripe webhooks            |
| Outbound  | Notifications.API | RabbitMQ with MassTransit | Reservation confirmation, cancellation and refund notifications            |

Reservations.API publishes:

* `ReservationConfirmed`
* `ReservationCancelled`
* `ReservationRefunded`

Notifications.API consumes these events and sends email messages. Reservations.API remains the source of truth for reservation and payment state.

## Related Project Documentation

* [Reservations class diagram](../../../../docs/class-diagrams.md#reservations-subsystem)
* [Reservation and payment flows](../../../../docs/architecture.md#reservation-with-pre-order-and-payment)
* [Reservations API reference](../../../../docs/api-reference.md#reservationsapi)
* [Source-code documentation](../../../../docs/source-code.md)
