# Setup and Run Guide

This guide describes the reproducible local-development setup for the complete ReserveNServe application. Docker Compose is the recommended path because it starts the APIs, databases, RabbitMQ, Mailpit, Stripe listener and frontend on one network.

## Prerequisites

| Requirement | Purpose |
| --- | --- |
| Git | Clone and update the repository |
| Docker Desktop or Docker Engine | Build and run the complete stack |
| Docker Compose v2 | Orchestrate services through `docker compose` |
| .NET SDK 10 | Run, test, migrate or document backend projects outside containers |
| Node.js 22 and npm | Run or build the Next.js frontend outside containers |
| Stripe test account | Obtain publishable, secret and webhook test credentials |

Confirm the core tools:

```bash
docker --version
docker compose version
dotnet --version
node --version
npm --version
```

## Repository layout relevant to startup

```text
ReserveNServe/
├── backend/ReserveNServeBackend/
│   ├── compose.yaml
│   ├── .env.example
│   ├── ReserveNServeBackend.slnx
│   ├── scripts/setup-dev-cert.sh
│   └── Services/
├── frontend/
│   ├── .env.local.example
│   ├── Dockerfile
│   └── package.json
├── docs/
├── scripts/generate-source-docs.sh
└── Doxyfile
```

## Quick start with Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/jelisavetagavrilovic/ReserveNServe.git
cd ReserveNServe/backend/ReserveNServeBackend
```

### 2. Create the backend environment file

```bash
cp .env.example .env
```

Replace every empty or `change-me` value. At minimum, configure:

- `MSSQL_SA_PASSWORD`, `RESTAURANTS_DB_PASSWORD`, and `PAYMENT_DB_PASSWORD`;
- `DB_PASSWORD` for PostgreSQL;
- the RabbitMQ password values used by Payment and Reservations;
- `JWT_KEY`, using a long random value;
- `PAYMENT_STRIPE_SECRET_KEY` and `PAYMENT_STRIPE_WEBHOOK_SECRET`;
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`;
- `ASPNET_HTTPS_PATH` and `ASPNETCORE_HTTPS_CERTIFICATE_PASSWORD`.

One way to generate local random values is:

```bash
openssl rand -base64 48
```

Use Stripe test keys (`pk_test_...`, `sk_test_...`) for local development. Never place a secret key in a `NEXT_PUBLIC_*` variable because Next.js embeds public variables in browser assets.

### 3. Configure matching RabbitMQ credentials

The current Compose broker uses the local `guest` account. Therefore these values must match:

```dotenv
PAYMENT_RABBITMQ_USERNAME=guest
PAYMENT_RABBITMQ_PASSWORD=guest
RESERVATIONS_RABBITMQ_USERNAME=guest
RESERVATIONS_RABBITMQ_PASSWORD=guest
```

If the broker account is changed, update both publishers and consumers consistently.

### 4. Create the development HTTPS certificate

From `backend/ReserveNServeBackend`:

```bash
chmod +x scripts/setup-dev-cert.sh
./scripts/setup-dev-cert.sh
```

The script exports `reservenserve.pfx` to the current user's `.aspnet/https` directory. Set `ASPNET_HTTPS_PATH` to that absolute directory. Examples:

```dotenv
# macOS or Linux example
ASPNET_HTTPS_PATH=/Users/your-name/.aspnet/https
```

```dotenv
# Windows Docker Desktop example
ASPNET_HTTPS_PATH=C:/Users/your-name/.aspnet/https
```

Trust the certificate when supported:

```bash
dotnet dev-certs https --trust
```

Identity.API and Notifications.API are exposed through HTTP in the current Compose setup. Restaurants.API, Reservations.API, and Payment.API expose both HTTP and HTTPS, while their internal gRPC listeners use HTTP/2 inside the Docker network.

### 5. Verify frontend public URLs

For the default ports, keep:

```dotenv
NEXT_PUBLIC_IDENTITY_API_URL=http://localhost:5206
NEXT_PUBLIC_RESTAURANTS_API_URL=https://localhost:7274
NEXT_PUBLIC_RESERVATIONS_API_URL=https://localhost:7294
```

The frontend image receives these values at build time. Rebuild the frontend after changing any `NEXT_PUBLIC_*` value. `NEXT_PUBLIC_PAYMENT_API_URL` is retained in the example environment for possible direct-payment tooling, but the current user flow starts payment through Reservations.API and does not require a browser call to Payment.API.

### 6. Build and start the stack

```bash
docker compose up --build -d
docker compose ps
```

The SQL Server health check can take up to two minutes during the first startup. Database initializer containers are expected to finish with exit code `0`; they are one-time jobs, not failed long-running services.

Follow startup logs:

```bash
docker compose logs -f --tail=200
```

Follow only the main application path:

```bash
docker compose logs -f frontend identity-api restaurants-api reservations-api payment-api notifications-api stripe-listener
```

## Local endpoints

| Component | Default address | Notes |
| --- | --- | --- |
| Frontend | `http://localhost:3000` | User interface |
| Identity API | `http://localhost:5206` | Swagger at `/swagger` in Development |
| Notifications API | `http://localhost:5200` | Health at `/api/health`; Swagger at `/swagger` |
| Restaurants API | `http://localhost:5174`, `https://localhost:7274` | Swagger at `/swagger` |
| Reservations API | `http://localhost:5040`, `https://localhost:7294` | Swagger at `/swagger` |
| Payment API | `http://localhost:5175`, `https://localhost:7275` | OpenAPI endpoint in Development |
| SQL Server | `localhost:1436` | Identity, Restaurants, Payment, Notifications databases |
| PostgreSQL | Docker network only | Reservations database |
| RabbitMQ AMQP | `localhost:5672` | Application messaging |
| RabbitMQ UI | `http://localhost:15672` | Local broker inspection |
| Mailpit SMTP | `localhost:1025` | Captures development email |
| Mailpit UI | `http://localhost:8025` | Read captured messages |

## First-run verification

1. Open `http://localhost:3000`.
2. Browse the restaurant list without signing in.
3. Register a new user.
4. Open Mailpit and follow the confirmation link.
5. Log in and create a reservation without a pre-order.
6. Confirm that the reservation appears under **My Bookings** and that Mailpit contains the confirmation email.
7. Create another reservation with a pre-order and use a Stripe test card.
8. Confirm that payment progresses from pending to succeeded and that the paid confirmation email appears.

Development-only Identity seeding creates an admin account. Its current credentials are defined in `IdentitySeeder.cs`; they must never be used in production.

## Stripe webhook flow

The Compose `stripe-listener` forwards these events to Payment.API:

- `payment_intent.succeeded`;
- `payment_intent.payment_failed`;
- `refund.created`;
- `refund.updated`;
- `refund.failed`.

Forwarding target:

```text
http://payment-api:8080/api/PaymentWebhook/StripeWebhook
```

`PAYMENT_STRIPE_WEBHOOK_SECRET` must match the signing secret produced for the active listener. If payment remains pending, inspect:

```bash
docker compose logs stripe-listener payment-api reservations-api rabbitmq
```

On a new Stripe CLI listener, copy the `whsec_...` signing secret shown in the listener log into `PAYMENT_STRIPE_WEBHOOK_SECRET`, then recreate Payment.API so it receives the value:

```bash
docker compose up -d --force-recreate payment-api
```

## Run the frontend outside Docker

From the repository root:

```bash
cd frontend
cp .env.local.example .env.local
npm ci
npm run build
npm start
```

Configure all values in `.env.local` before starting. Backend APIs must already be reachable at those browser-visible URLs. Open `http://localhost:3000`.

Useful frontend commands:

```bash
npm run lint
npm run build
npm run start
```

## Run backend projects outside Docker

The simplest hybrid workflow keeps databases, RabbitMQ, Mailpit, and Stripe CLI in Docker while an API runs from the .NET SDK. Local connection strings and ports must be overridden because Docker service names such as `sqlserver`, `rabbitmq` and `reservations-db` only resolve inside the Compose network.

Each service README contains its specific command and configuration:

- [Identity](../backend/ReserveNServeBackend/Services/Identity/README.md)
- [Restaurants](../backend/ReserveNServeBackend/Services/Restaurants/README.md)
- [Reservations](../backend/ReserveNServeBackend/Services/Reservations/README.md)
- [Payment](../backend/ReserveNServeBackend/Services/Payment/README.md)
- [Notifications](../backend/ReserveNServeBackend/Services/Notifications/README.md)

General form:

```bash
cd backend/ReserveNServeBackend
dotnet restore ReserveNServeBackend.slnx
dotnet run --project Services/Identity/Identity.API/Identity.API.csproj
```

Do not start both the local process and its Compose API container on the same host port.

## Database initialization and migrations

- Identity and Notifications apply Entity Framework Core migrations at application startup.
- Reservations applies PostgreSQL migrations at application startup.
- Restaurants and Payment databases are initialized by one-time Compose jobs using their `Database/init.sql` scripts.
- Every service owns its schema. Do not create cross-service foreign keys or query another service's database directly.

To reset all local Docker data:

```bash
docker compose down -v
docker compose up --build -d
```

The `-v` operation permanently removes local development database and broker volumes. Export any data you need before using it.

## Tests

Run the full backend solution test suite from `backend/ReserveNServeBackend`:

```bash
dotnet test ReserveNServeBackend.slnx
```

The solution includes unit-test projects for all five services and end-to-end tests under `Services/Tests/ReserveNServe.E2E.Tests`. End-to-end tests require the relevant Docker services, reachable endpoints and Stripe test configuration.

Frontend validation:

```bash
cd frontend
npm run lint
npm run build
```

## Generate source-code documentation

Install Doxygen and Graphviz, then run from the repository root:

```bash
chmod +x scripts/generate-source-docs.sh
./scripts/generate-source-docs.sh
```

Open:

```text
docs/generated/doxygen/html/index.html
```

See [Source-code documentation](source-code.md) for configuration and maintenance guidance.

## Stop or rebuild

```bash
# Stop containers and retain data
docker compose down

# Rebuild after source or public frontend configuration changes
docker compose up --build -d

# Rebuild only one service
docker compose up --build -d reservations-api
```

## Troubleshooting

### A container is unhealthy or repeatedly restarts

```bash
docker compose ps
docker compose logs --tail=250 service-name
```

Start with the first error in the affected container, then inspect its dependency: database, RabbitMQ, Stripe listener or another API.

### SQL Server initialization takes a long time

First startup is intentionally allowed a 120-second health-check start period. Confirm the password satisfies SQL Server complexity requirements and check:

```bash
docker compose logs sqlserver restaurants-db-init payment-db-init
```

### Browser certificate error or failed HTTPS request

- run `dotnet dev-certs https --trust`;
- verify the mounted PFX exists at `ASPNET_HTTPS_PATH`;
- verify the PFX password matches `ASPNETCORE_HTTPS_CERTIFICATE_PASSWORD`;
- rebuild the affected API;
- use the HTTP endpoint temporarily only for local diagnosis where one is exposed.

### Frontend reports that an API URL is not configured

Confirm every required `NEXT_PUBLIC_*` value exists before `npm run build` or `docker compose build frontend`. These are build-time values, so restarting an old image is not enough.

### Restaurant slots are empty

Check the requested date, guest count, restaurant working hours, reservation duration, table groups and overlapping active reservations. Then inspect both Reservations.API and Restaurants.API because availability combines data from both services over gRPC.

### Payment remains pending

Check the Stripe listener, webhook secret, Payment API webhook log, RabbitMQ connection and Reservations consumer. The expected path is Stripe → Payment.API → RabbitMQ → Reservations.API.

### Email is not delivered

Check RabbitMQ, Notifications.API and Mailpit in that order. Development logs are also available at `GET http://localhost:5200/api/email/logs`.

### Port is already in use

Change the corresponding port variable in `.env`, stop the conflicting process, or stop the duplicate local API. Remember to update matching browser-visible `NEXT_PUBLIC_*` URLs and rebuild the frontend.
