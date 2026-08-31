# Notifications.API

Notifications.API is the asynchronous email-delivery microservice of ReserveNServe. It consumes integration events, renders HTML templates, sends email through SMTP, and stores delivery logs.

## 1. Purpose

The service keeps email delivery outside the business services. Identity and Reservations publish events; Notifications converts those events into user-facing emails.

Default Docker URL:

```text
http://localhost:5200
```

Development Mailpit UI:

```text
http://localhost:8025
```

## 2. Responsibilities

- Consume notification events from RabbitMQ using MassTransit.
- Render HTML emails with Scriban templates.
- Send emails through SMTP using MailKit.
- Store email delivery attempts and status in SQL Server.
- Send account confirmation and password-reset emails.
- Send RestaurantOwner approval emails.
- Send reservation confirmation, cancellation, and refund emails.
- Provide basic health and development-only email diagnostics.

## 3. Project Structure

```text
Services/Notifications/
├── docker-compose.notifications.yml
└── Notifications.API/
    ├── Consumers/          # One MassTransit consumer per event type
    ├── Controllers/        # Health and development diagnostics
    ├── Data/               # EmailMessage and NotificationsDbContext
    ├── DTOs/
    ├── Extensions/         # DI and application setup
    ├── Migrations/         # EF Core migrations
    ├── Services/           # Dispatcher, SMTP sender, template renderer
    ├── Templates/          # HTML/Scriban email templates
    ├── Program.cs
    ├── appsettings*.json
    └── Dockerfile
```

Shared event contracts are defined in:

```text
BuildingBlocks/Contracts/Events.cs
```

## 4. Main Endpoints

Notifications is primarily event-driven, so its HTTP API is intentionally small.

| Method | Endpoint | Environment | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | All | Basic service liveness |
| POST | `/api/email/test` | Development | Send a test email |
| GET | `/api/email/logs` | Development | Return the latest 20 email logs |

Swagger in Development:

```text
http://localhost:5200/swagger
```

The normal application flow does not call these endpoints to send notifications. Emails are triggered by RabbitMQ events.

## 5. Database

Notifications.API uses SQL Server with Entity Framework Core.

Default database:

```text
ReserveNServe.Notifications
```

Main table:

```text
EmailMessages
```

Important fields:

```text
Id
ToEmail
Subject
TemplateName
Status
Attempts
Error
CreatedAtUtc
SentAtUtc
```

Typical statuses are:

```text
Pending
Sent
Failed
```

EF Core migrations are applied automatically at startup.

The database stores delivery metadata, not the complete source business entity.

## 6. Configuration

### Database

```text
ConnectionStrings__NotificationsDb
```

### RabbitMQ

```text
RabbitMq__Host
RabbitMq__Username
RabbitMq__Password
```

### SMTP

```text
Smtp__Host
Smtp__Port
Smtp__UseSsl
Smtp__User
Smtp__Password
Smtp__FromName
Smtp__FromAddress
```

### Frontend URL

```text
FrontendBaseUrl
```

It is used when generating links such as email-confirmation and password-reset URLs.

Typical Docker development configuration:

```text
RabbitMq__Host=rabbitmq
Smtp__Host=mailpit
Smtp__Port=1025
Smtp__UseSsl=false
FrontendBaseUrl=http://localhost:3000
```

Default host ports:

```text
Notifications API : 5200
RabbitMQ          : 5672
RabbitMQ UI       : 15672
Mailpit SMTP      : 1025
Mailpit UI        : 8025
SQL Server        : 1436
```

## 7. How to Run

From the backend root:

```bash
cd backend/ReserveNServeBackend
cp .env.example .env
```

Start the service with its infrastructure:

```bash
docker compose up -d --build sqlserver rabbitmq mailpit notifications-api
```

Verify health:

```text
http://localhost:5200/api/health
```

Open Mailpit to inspect development emails:

```text
http://localhost:8025
```

Open Swagger:

```text
http://localhost:5200/swagger
```

For direct host development:

```bash
dotnet run --project Services/Notifications/Notifications.API/Notifications.API.csproj
```

Make sure SQL Server, RabbitMQ, and the configured SMTP server are reachable from the host process.

## 8. Communication with Other Services

```text
Identity.API --------\
                      \
                       > RabbitMQ / MassTransit -> Notifications.API -> SMTP -> Mailpit/provider
                      /
Reservations.API ----/
```

Notifications currently consumes these events:

| Publisher | Event | Email purpose |
| --- | --- | --- |
| Identity.API | `UserRegistered` | Confirm email |
| Identity.API | `PasswordResetRequested` | Reset password |
| Identity.API | `OwnerRequestApproved` | Owner-role result |
| Reservations.API | `ReservationConfirmed` | Reservation confirmation |
| Reservations.API | `ReservationCancelled` | Cancellation confirmation |
| Reservations.API | `ReservationRefunded` | Refund confirmation |

Notifications does not call Identity, Restaurants, Reservations, or Payment synchronously.

Current behavior to be aware of: SMTP failures are recorded as `Failed` by the dispatcher. Because the exception is handled inside the email-dispatch layer, the current MassTransit consumer does not automatically retry that failed SMTP send.
