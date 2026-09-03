# Notifications.API

Notifications.API is the asynchronous email-delivery microservice of ReserveNServe. It consumes integration events, renders HTML templates, sends email through SMTP, and stores delivery logs.

## 1. Purpose

The service keeps email generation and delivery outside the business services. Identity.API and Reservations.API publish integration events, which Notifications.API converts into user-facing emails.

## 2. Responsibilities

* Consume notification events from RabbitMQ using MassTransit
* Render HTML emails with Scriban templates
* Send emails through SMTP using MailKit
* Store email delivery attempts and statuses
* Send account-confirmation and password-reset emails
* Send RestaurantOwner approval emails
* Send reservation confirmation, cancellation, and refund emails
* Provide basic health and development-only email diagnostics

## 3. Project Structure

```text
Services/Notifications/
├── Notifications.API/
│   ├── Consumers/          # MassTransit event consumers
│   ├── Controllers/        # Health and development diagnostics
│   ├── Data/               # EmailMessage and NotificationsDbContext
│   ├── DTOs/
│   ├── Extensions/         # Dependency injection and application setup
│   ├── Migrations/         # Entity Framework Core migrations
│   ├── Services/           # Dispatcher, SMTP sender, and template renderer
│   ├── Templates/          # HTML and Scriban email templates
│   ├── Program.cs
│   ├── appsettings*.json
│   └── Dockerfile
├── Notifications.API.Tests/
└── docker-compose.notifications.yml
```

Shared integration-event contracts are located in:

```text
BuildingBlocks/Contracts/Events.cs
```

## 4. Main Endpoints

Notifications.API is primarily event-driven, so its HTTP API is intentionally small.

| Method | Endpoint          | Environment | Purpose                                  |
| ------ | ----------------- | ----------- | ---------------------------------------- |
| GET    | `/api/health`     | All         | Check service liveness                   |
| POST   | `/api/email/test` | Development | Send a test email                        |
| GET    | `/api/email/logs` | Development | Return the latest 20 email delivery logs |

Swagger is available in the Development environment at `http://localhost:5200/swagger`.

Normal application workflows do not call these endpoints to send notifications. Emails are triggered by RabbitMQ events.

## 5. Database

Notifications.API uses **SQL Server** with **Entity Framework Core**.

The default database is:

```text
ReserveNServe.Notifications
```

The main table is `EmailMessages`.

| Field          | Purpose                             |
| -------------- | ----------------------------------- |
| `Id`           | Email log identifier                |
| `ToEmail`      | Recipient address                   |
| `Subject`      | Email subject                       |
| `TemplateName` | Template used to render the message |
| `Status`       | `Pending`, `Sent`, or `Failed`      |
| `Attempts`     | Number of delivery attempts         |
| `Error`        | Delivery error when sending fails   |
| `CreatedAtUtc` | Log creation time                   |
| `SentAtUtc`    | Successful delivery time            |

The database stores email delivery metadata rather than complete reservation or user entities.

Entity Framework Core migrations are applied automatically when the service starts.

## 6. Configuration

| Setting                                                      | Purpose                                                |
| ------------------------------------------------------------ | ------------------------------------------------------ |
| `ConnectionStrings__NotificationsDb`                         | SQL Server connection                                  |
| `RabbitMq__Host`, `RabbitMq__Username`, `RabbitMq__Password` | RabbitMQ connection                                    |
| `Smtp__Host`, `Smtp__Port`, `Smtp__UseSsl`                   | SMTP server and transport settings                     |
| `Smtp__User`, `Smtp__Password`                               | Optional SMTP credentials                              |
| `Smtp__FromName`, `Smtp__FromAddress`                        | Email sender identity                                  |
| `FrontendBaseUrl`                                            | Base URL used in confirmation and password-reset links |

Typical Docker development values are:

```text
RabbitMq__Host=rabbitmq
Smtp__Host=mailpit
Smtp__Port=1025
Smtp__UseSsl=false
FrontendBaseUrl=http://localhost:3000
```

## 7. How to Run

Configure the root `.env` file as described in the [Setup and Run Guide](../../../../docs/setup-and-run.md).

From `backend/ReserveNServeBackend`, run:

```bash
docker compose up -d --build \
  sqlserver rabbitmq mailpit notifications-api
```

Useful development addresses:

| Component       | Address                            |
| --------------- | ---------------------------------- |
| Health endpoint | `http://localhost:5200/api/health` |
| Swagger         | `http://localhost:5200/swagger`    |
| Mailpit         | `http://localhost:8025`            |

For direct host development:

```bash
dotnet run --project Services/Notifications/Notifications.API/Notifications.API.csproj
```

SQL Server, RabbitMQ, and the configured SMTP server must be reachable from the host process.

## 8. Communication with Other Services

Notifications.API consumes the following events:

| Publisher        | Event                    | Email purpose                  |
| ---------------- | ------------------------ | ------------------------------ |
| Identity.API     | `UserRegistered`         | Email confirmation             |
| Identity.API     | `PasswordResetRequested` | Password reset                 |
| Identity.API     | `OwnerRequestApproved`   | RestaurantOwner request result |
| Reservations.API | `ReservationConfirmed`   | Reservation confirmation       |
| Reservations.API | `ReservationCancelled`   | Cancellation confirmation      |
| Reservations.API | `ReservationRefunded`    | Refund confirmation            |

All events are received asynchronously through RabbitMQ and MassTransit.

Notifications.API does not call Identity.API, Restaurants.API, Reservations.API, or Payment.API synchronously.

## Related Project Documentation

* [Notifications class diagram](../../../../docs/class-diagrams.md#notifications-subsystem)
* [Integration event catalogue](../../../../docs/architecture.md#integration-events)
* [Notifications API reference](../../../../docs/api-reference.md#notificationsapi)
* [Source-code documentation](../../../../docs/source-code.md)
