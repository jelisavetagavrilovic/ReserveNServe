# Identity.API

Identity.API is the authentication and authorization microservice of ReserveNServe. It owns user accounts, credentials, JWT access tokens, refresh tokens, roles, email verification, password recovery and the RestaurantOwner approval workflow.

## 1. Purpose

The service provides a single identity boundary for the platform. Other backend services validate JWTs issued by Identity.API instead of managing user credentials themselves.

## 2. Responsibilities

* Register users
* Require email confirmation before login
* Authenticate users and issue JWT access tokens
* Create, rotate, revoke and hash refresh tokens
* Support logout and logout from all sessions
* Support forgot-password and reset-password workflows
* Read and update the current user profile
* Manage `User`, `Admin` and `RestaurantOwner` roles
* Process RestaurantOwner requests and administrator approval
* Publish identity-related notification events to RabbitMQ

## 3. Project Structure

```text
Services/Identity/
├── Identity.API/
│   ├── Controllers/        # Authentication, administration and owner requests
│   ├── Data/               # DbContext, ApplicationUser and data seeding
│   ├── DTOs/               # API request and response models
│   ├── Entities/           # RefreshToken entity
│   ├── Extensions/         # Dependency injection and application setup
│   ├── Migrations/         # Entity Framework Core migrations
│   ├── Services/           # Authentication, tokens and owner workflow
│   ├── Program.cs
│   ├── appsettings*.json
│   └── Dockerfile
└── Tests/
    └── Identity.API.Tests/
```

Shared integration-event contracts are located in:

```text
BuildingBlocks/Contracts
```

## 4. Main Endpoints

| Method | Endpoint                       | Authorization   | Purpose                                             |
| ------ | ------------------------------ | --------------- | --------------------------------------------------- |
| POST   | `/api/auth/register`           | Public          | Register a user                                     |
| POST   | `/api/auth/login`              | Public          | Authenticate and receive access and refresh tokens  |
| POST   | `/api/auth/refresh`            | Public          | Rotate the refresh token and issue a new token pair |
| POST   | `/api/auth/logout`             | JWT             | Revoke one refresh token                            |
| POST   | `/api/auth/logout-all`         | JWT             | Revoke all sessions for the current user            |
| GET    | `/api/auth/me`                 | JWT             | Get the current user profile                        |
| PUT    | `/api/auth/me`                 | JWT             | Update the current user profile                     |
| POST   | `/api/auth/confirm-email`      | Public          | Confirm an email address                            |
| POST   | `/api/auth/forgot-password`    | Public          | Start the password-reset workflow                   |
| POST   | `/api/auth/reset-password`     | Public          | Reset a password                                    |
| POST   | `/api/owners/requests`         | JWT             | Request the RestaurantOwner role                    |
| GET    | `/api/owners/requests`         | Admin           | List pending owner requests                         |
| POST   | `/api/owners/requests/approve` | Admin           | Approve or reject an owner request                  |
| GET    | `/api/owners/ping`             | RestaurantOwner | Verify owner authorization                          |
| GET    | `/api/admin/ping`              | Admin           | Verify administrator authorization                  |

Swagger is available in the Development environment at `http://localhost:5206/swagger`.

## 5. Database

Identity.API uses **SQL Server** with **Entity Framework Core**.

The default database is:

```text
ReserveNServe.Identity
```

The database contains the standard ASP.NET Core Identity tables and the `RefreshTokens` table.

`AspNetUsers` also stores ReserveNServe-specific fields such as:

* `FullName`
* `OwnerRequestPending`
* `OwnerRequestedAtUtc`

Entity Framework Core migrations are applied automatically when the service starts.

## 6. Configuration

| Setting                        | Environment variable            | Purpose                |
| ------------------------------ | ------------------------------- | ---------------------- |
| `ConnectionStrings:IdentityDb` | `ConnectionStrings__IdentityDb` | SQL Server connection  |
| `Jwt:Issuer`                   | `Jwt__Issuer`                   | JWT issuer             |
| `Jwt:Audience`                 | `Jwt__Audience`                 | JWT audience           |
| `Jwt:Key`                      | `Jwt__Key`                      | JWT signing key        |
| `Jwt:AccessTokenMinutes`       | `Jwt__AccessTokenMinutes`       | Access-token lifetime  |
| `RefreshToken:ExpirationDays`  | `RefreshToken__ExpirationDays`  | Refresh-token lifetime |
| `RabbitMq:Host`                | `RabbitMq__Host`                | RabbitMQ host          |
| `RabbitMq:Username`            | `RabbitMq__Username`            | RabbitMQ username      |
| `RabbitMq:Password`            | `RabbitMq__Password`            | RabbitMQ password      |

The root `.env` file supplies the required values to Docker Compose.

Identity.API, Reservations.API, and Payment.API must use the same JWT issuer, audience and signing key.

## 7. How to Run

Configure the root `.env` file as described in the [Setup and Run Guide](../../../../docs/setup-and-run.md).

From `backend/ReserveNServeBackend`, run:

```bash
docker compose up -d --build \
  sqlserver rabbitmq mailpit \
  notifications-api identity-api
```

For direct host development:

```bash
dotnet run --project Services/Identity/Identity.API/Identity.API.csproj
```

When using macOS or Linux, override the default LocalDB connection string with a reachable SQL Server connection.

## 8. Communication with Other Services

| Direction | Component         | Mechanism                 | Purpose                                                             |
| --------- | ----------------- | ------------------------- | ------------------------------------------------------------------- |
| Inbound   | Frontend          | REST/JSON                 | Registration, authentication, profile and owner-request workflows  |
| Outbound  | Notifications.API | RabbitMQ with MassTransit | Email confirmation, password reset and owner-request notifications |

Identity.API publishes the following integration events:

* `UserRegistered`
* `PasswordResetRequested`
* `OwnerRequestApproved`

Identity.API does not call Restaurants.API, Reservations.API or Payment.API directly. It issues JWTs that protected backend services validate using the shared JWT configuration.

## Related Project Documentation

* [Identity class diagram](../../../../docs/class-diagrams.md#identity-subsystem)
* [Authentication architecture](../../../../docs/architecture.md#authentication-and-authorization)
* [Identity API reference](../../../../docs/api-reference.md#identityapi)
* [Source-code documentation](../../../../docs/source-code.md)
