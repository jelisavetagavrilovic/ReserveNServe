# Identity.API

Identity.API is the authentication and authorization microservice of ReserveNServe. It owns user accounts, credentials, JWT access tokens, refresh tokens, roles, email verification, password recovery, and the RestaurantOwner approval workflow.

## 1. Purpose

The service provides a single identity boundary for the platform. Other backend services validate JWTs issued by Identity.API instead of managing users themselves.

Default Docker URL:

```text
http://localhost:5206
```

## 2. Responsibilities

- Register users.
- Require email confirmation before login.
- Authenticate users and issue JWT access tokens.
- Create, rotate, revoke, and hash refresh tokens.
- Support logout and logout-all-sessions.
- Support forgot-password and reset-password flows.
- Read and update the current user profile.
- Manage `User`, `Admin`, and `RestaurantOwner` roles.
- Accept RestaurantOwner requests and allow admins to approve them.
- Publish identity-related notification events to RabbitMQ.

## 3. Project Structure

```text
Services/Identity/
├── Identity.API/
│   ├── Controllers/        # Auth, admin and owner-request HTTP endpoints
│   ├── Data/               # DbContext, ApplicationUser and seeding
│   ├── DTOs/               # API request/response models
│   ├── Entities/           # RefreshToken
│   ├── Extensions/         # DI and application configuration
│   ├── Migrations/         # EF Core migrations
│   ├── Services/           # Authentication, owner workflow and token logic
│   ├── Program.cs
│   ├── appsettings*.json
│   └── Dockerfile
└── Tests/
    └── Identity.API.Tests/
```

Shared integration-event contracts are referenced from:

```text
BuildingBlocks/Contracts
```

## 4. Main Endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Register a user |
| POST | `/api/auth/login` | No | Login and receive access/refresh tokens |
| POST | `/api/auth/refresh` | No | Rotate refresh token and issue a new token pair |
| POST | `/api/auth/logout` | JWT | Revoke one refresh token |
| POST | `/api/auth/logout-all` | JWT | Revoke all sessions |
| GET | `/api/auth/me` | JWT | Get current user profile |
| PUT | `/api/auth/me` | JWT | Update current user profile |
| POST | `/api/auth/confirm-email` | No | Confirm email address |
| POST | `/api/auth/forgot-password` | No | Start password reset |
| POST | `/api/auth/reset-password` | No | Reset password |
| POST | `/api/owners/requests` | JWT | Request RestaurantOwner role |
| GET | `/api/owners/requests` | Admin | List pending owner requests |
| POST | `/api/owners/requests/approve` | Admin | Approve an owner request |
| GET | `/api/owners/ping` | Owner | Check owner authorization |
| GET | `/api/admin/ping` | Admin | Check admin authorization |

Swagger is available in Development mode at:

```text
http://localhost:5206/swagger
```

## 5. Database

Identity.API uses SQL Server with Entity Framework Core.

Default database:

```text
ReserveNServe.Identity
```

Main tables include the standard ASP.NET Identity tables:

```text
AspNetUsers
AspNetRoles
AspNetUserRoles
AspNetUserClaims
AspNetRoleClaims
AspNetUserLogins
AspNetUserTokens
RefreshTokens
```

`AspNetUsers` also stores ReserveNServe-specific profile and owner-request fields such as `FullName`, `OwnerRequestPending`, and `OwnerRequestedAtUtc`.

EF Core migrations are applied automatically when the service starts.

Docker SQL Server is published on:

```text
localhost:1436
```

## 6. Configuration

Important settings:

| Setting | Environment variable | Purpose |
| --- | --- | --- |
| `ConnectionStrings:IdentityDb` | `ConnectionStrings__IdentityDb` | SQL Server connection |
| `Jwt:Issuer` | `Jwt__Issuer` | JWT issuer |
| `Jwt:Audience` | `Jwt__Audience` | JWT audience |
| `Jwt:Key` | `Jwt__Key` | JWT signing key |
| `Jwt:AccessTokenMinutes` | `Jwt__AccessTokenMinutes` | Access-token lifetime |
| `RefreshToken:ExpirationDays` | `RefreshToken__ExpirationDays` | Refresh-token lifetime |
| `RabbitMq:Host` | `RabbitMq__Host` | RabbitMQ host |
| `RabbitMq:Username` | `RabbitMq__Username` | RabbitMQ username |
| `RabbitMq:Password` | `RabbitMq__Password` | RabbitMQ password |

The root `.env` provides the shared JWT values:

```dotenv
JWT_ISSUER=ReserveNServe.Identity
JWT_AUDIENCE=ReserveNServe.ApiClients
JWT_KEY=<strong-development-key>
MSSQL_SA_PASSWORD=<sql-server-password>
```

All services that validate ReserveNServe JWTs must use the same issuer, audience, and signing key.

## 7. How to Run

From the backend root:

```bash
cd backend/ReserveNServeBackend
cp .env.example .env
```

Fill in the required SQL Server and JWT values, then run:

```bash
docker compose up -d --build sqlserver rabbitmq identity-api
```

To include email confirmation/password-reset delivery during development:

```bash
docker compose up -d --build sqlserver rabbitmq mailpit notifications-api identity-api
```

Check the service:

```text
http://localhost:5206/swagger
```

For direct host development:

```bash
dotnet run --project Services/Identity/Identity.API/Identity.API.csproj
```

When running on macOS/Linux, override the default LocalDB connection string with a reachable SQL Server connection.

## 8. Communication with Other Services

```text
Frontend
   |
   | REST / JWT
   v
Identity.API
   |
   | MassTransit / RabbitMQ events
   v
Notifications.API
```

Identity.API publishes these notification events:

- `UserRegistered` — email confirmation, including email changes.
- `PasswordResetRequested` — password-reset email.
- `OwnerRequestApproved` — RestaurantOwner approval notification.

Identity.API does not call Restaurants, Reservations, or Payment directly. Instead, it issues JWTs that those services validate using the shared JWT configuration.
