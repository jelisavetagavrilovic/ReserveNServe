# Reservations.API

Reservations is the core reservation-domain microservice of ReserveNServe. It manages reservation state, table availability, food preorders, and coordination with restaurant and payment services.

## 1. Purpose

The service owns the reservation lifecycle. It combines restaurant reference data from Restaurants.API with its own reservation records to decide whether a time/table group is available.

Default Docker URLs:

```text
HTTP:  http://localhost:5040
HTTPS: https://localhost:7294
```

## 2. Responsibilities

- Create and manage reservations.
- Return a user's reservations.
- Calculate available reservation slots.
- Calculate remaining tables by table-capacity group.
- Store food preorders as reservation orders.
- Validate menu items/prices using Restaurants.API.
- Start card payments through Payment.API.
- Request refunds when required during cancellation.
- Consume asynchronous payment-status updates.
- Publish reservation confirmation, cancellation, and refund notification events.
- Enforce reservation ownership using JWT claims.

## 3. Project Structure

```text
Services/Reservations/
├── Reservations.API/
│   ├── Controllers/        # HTTP endpoints
│   ├── Middleware/         # Exception handling
│   └── Program.cs
├── Reservations.Application/
│   ├── DTOs/
│   ├── Interfaces/
│   └── Services/           # ReservationService
├── Reservations.Domain/
│   ├── Entities/           # Reservation, Order
│   └── ValueObjects/       # Reservation/payment status enums
└── Reservations.Infrastructure/
    ├── Clients/            # Restaurants, Payment, Notifications
    ├── DatabaseContext/    # ReservationsDbContext
    ├── Messaging/          # Payment status consumer
    ├── Migrations/
    ├── Protos/             # restaurants.proto, payment.proto
    └── Repositories/
```

## 4. Main Endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/reservations` | JWT | Create reservation |
| GET | `/api/reservations/{id}` | JWT | Get one owned reservation |
| GET | `/api/reservations` | JWT | Get paginated owned reservations |
| PUT | `/api/reservations/{id}` | JWT | Update reservation details |
| PUT | `/api/reservations/{id}/orders` | JWT | Replace food preorder |
| POST | `/api/reservations/{id}/payment` | JWT | Start/retry payment |
| DELETE | `/api/reservations/{id}` | JWT | Cancel reservation and request refund if needed |
| GET | `/api/reservations/availability/slots` | No | Get available start times |
| GET | `/api/reservations/availability/tables` | No | Get remaining table groups |

Authenticated operations use the user ID from the JWT and verify reservation ownership.

Swagger in Development:

```text
https://localhost:7294/swagger
```

## 5. Database

Reservations uses PostgreSQL with Entity Framework Core.

Default database:

```text
ReservationsDb
```

Main tables:

### `Reservations`

Stores reservation owner, restaurant/table-group references, start/end time, guest count, serving time, total amount, reservation status, and payment status.

### `Orders`

Stores preorder snapshots:

```text
ReservationId
MenuItemId
FoodName
Price
Quantity
```

Relationship:

```text
Reservation 1 ---- * Orders
```

The service stores restaurant and menu IDs from Restaurants.API but does not duplicate the full restaurant catalogue.

EF Core migrations are applied automatically at startup.

## 6. Configuration

### PostgreSQL

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

### Internal gRPC services

```text
GrpcServices__Restaurants=http://restaurants-api:8082
GrpcServices__Payment=http://payment-api:8082
```

### RabbitMQ

```text
RabbitMq__Host
RabbitMq__Username
RabbitMq__Password
```

### JWT

```text
Jwt__Issuer
Jwt__Audience
Jwt__Key
```

Important root `.env` values include:

```dotenv
DB_NAME=ReservationsDb
DB_USER=reservations_user
DB_PASSWORD=<password>
RESERVATIONS_HTTP_PORT=5040
RESERVATIONS_HTTPS_PORT=7294
JWT_ISSUER=ReserveNServe.Identity
JWT_AUDIENCE=ReserveNServe.ApiClients
JWT_KEY=<shared-jwt-key>
```

Inside Docker the database address is:

```text
reservations-db:5432
```

## 7. How to Run

Reservations depends on PostgreSQL, Restaurants.API, Payment.API, and RabbitMQ.

From the backend root:

```bash
cd backend/ReserveNServeBackend
cp .env.example .env
```

Prepare the HTTPS development certificate if it has not already been created:

```bash
chmod +x scripts/setup-dev-cert.sh
./scripts/setup-dev-cert.sh
```

Start the required services:

```bash
docker compose up -d --build \
  sqlserver rabbitmq reservations-db \
  restaurants-db-init payment-db-init \
  restaurants-api payment-api reservations-api
```

Open:

```text
https://localhost:7294/swagger
```

For direct host development:

```bash
dotnet run --project Services/Reservations/Reservations.API/Reservations.API.csproj
```

Note: PostgreSQL and the Restaurants/Payment gRPC ports are not published to the host by default in the current Compose setup, so host execution may require additional port mappings.

## 8. Communication with Other Services

```text
Frontend
   |
   | REST + JWT
   v
Reservations.API
   |             \
   | gRPC         \ gRPC
   v               v
Restaurants.API   Payment.API
   ^                 |
   |                 | RabbitMQ payment status
   |                 v
   +----------- Reservations.API
                     |
                     | MassTransit / RabbitMQ events
                     v
                Notifications.API
```

### Restaurants.API — synchronous gRPC

Used to obtain restaurant hours, reservation duration, table groups, and menu-item data.

### Payment.API — synchronous gRPC

Used to create PaymentIntents and request refunds.

### Payment status — asynchronous RabbitMQ

Payment.API publishes status changes after Stripe webhook processing. Reservations consumes them and updates reservation payment state.

### Notifications.API — asynchronous events

Reservations publishes events such as:

- `ReservationConfirmed`
- `ReservationCancelled`
- `ReservationRefunded`

Notifications.API consumes those events and sends email.
