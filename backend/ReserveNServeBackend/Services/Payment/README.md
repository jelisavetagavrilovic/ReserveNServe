# Payment.API

Payment.API is the payment microservice of ReserveNServe. It integrates the backend with Stripe, stores payment records, handles Stripe webhooks, performs refunds, and publishes payment-status changes to Reservations.API.

## 1. Purpose

The service isolates Stripe-specific logic from the reservation domain. Reservations.API asks Payment.API to create/refund payments, while Stripe webhooks determine the final payment/refund status asynchronously.

Default Docker URLs:

```text
HTTP:  http://localhost:5175
HTTPS: https://localhost:7275
```

## 2. Responsibilities

- Create Stripe PaymentIntents.
- Reuse an existing PaymentIntent for a reservation when appropriate.
- Store payment records and their status.
- Create Stripe refunds.
- Verify Stripe webhook signatures.
- Handle payment success/failure and refund events.
- Publish payment-status changes to RabbitMQ.
- Expose an internal gRPC API to Reservations.API.
- Protect public REST payment operations with JWT authentication.

## 3. Project Structure

```text
Services/Payment/
├── Payment.API/
│   ├── Controllers/        # Payment and Stripe webhook endpoints
│   ├── Data/               # PaymentsContext
│   ├── Database/           # init.sql and initializer
│   ├── DTO/                # REST request models
│   ├── Entities/           # Payment
│   ├── Enums/              # PaymentStatus
│   ├── Grpc/               # PaymentsGrpcService
│   ├── Handler/            # Payment application logic
│   ├── Messaging/          # RabbitMQ status publisher
│   ├── Protos/             # payment.proto
│   ├── Repositories/       # Payment persistence
│   ├── Services/           # StripePaymentService
│   ├── Program.cs
│   └── Dockerfile
└── Payment.API.Test/
```

## 4. Main Endpoints

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/Payment/CreatePaymentIntent` | JWT | Create/reuse Stripe PaymentIntent |
| POST | `/api/Payment/Refund` | JWT | Create a Stripe refund |
| POST | `/api/PaymentWebhook/StripeWebhook` | Stripe signature | Process Stripe webhook events |

Normal ReserveNServe checkout does not call Payment.API directly from the browser. Reservations.API uses Payment's internal gRPC API.

Swagger in Development:

```text
https://localhost:7275/swagger
```

## 5. Database

Payment.API uses SQL Server through Entity Framework Core.

Main table:

```text
Payments
```

Columns:

| Column | Purpose |
| --- | --- |
| `id` | Primary key |
| `reservation_id` | Reservation identifier |
| `payment_intent` | Stripe PaymentIntent ID |
| `status` | Internal payment status |

Unlike Reservations and Identity, Payment currently initializes its schema through:

```text
Payment.API/Database/init.sql
```

The root Compose stack runs it with:

```text
payment-db-init
```

Current repository note: `init.sql` contains `USE Payment`, so local Docker configuration should keep:

```dotenv
PAYMENT_DB_NAME=Payment
```

unless the initialization script is changed.

## 6. Configuration

Important root `.env` values:

```dotenv
MSSQL_SA_PASSWORD=<sql-server-password>
PAYMENT_DB_NAME=Payment
PAYMENT_DB_USER=payment_user
PAYMENT_DB_PASSWORD=<payment-db-password>
PAYMENT_HTTP_PORT=5175
PAYMENT_HTTPS_PORT=7275

PAYMENT_STRIPE_SECRET_KEY=sk_test_...
PAYMENT_STRIPE_WEBHOOK_SECRET=whsec_...

PAYMENT_RABBITMQ_HOST=rabbitmq
PAYMENT_RABBITMQ_USERNAME=guest
PAYMENT_RABBITMQ_PASSWORD=guest

JWT_ISSUER=ReserveNServe.Identity
JWT_AUDIENCE=ReserveNServe.ApiClients
JWT_KEY=<shared-jwt-key>
```

Docker exposes:

```text
REST HTTP : 8080 -> host 5175
REST HTTPS: 8081 -> host 7275
gRPC      : 8082 -> internal only
```

Stripe secret keys must remain server-side and must never be exposed through `NEXT_PUBLIC_*` variables.

## 7. How to Run

From the backend root:

```bash
cd backend/ReserveNServeBackend
cp .env.example .env
```

Create the HTTPS development certificate if needed:

```bash
chmod +x scripts/setup-dev-cert.sh
./scripts/setup-dev-cert.sh
```

Start infrastructure and Payment.API:

```bash
docker compose up -d --build sqlserver rabbitmq payment-db-init payment-api
```

For local Stripe webhooks, run Stripe CLI on the host:

```bash
stripe listen \
  --events payment_intent.succeeded,payment_intent.payment_failed,refund.created,refund.updated,refund.failed \
  --forward-to http://localhost:5175/api/PaymentWebhook/StripeWebhook
```

Copy the generated `whsec_...` value into:

```text
PAYMENT_STRIPE_WEBHOOK_SECRET
```

and restart Payment.API if necessary.

Open:

```text
https://localhost:7275/swagger
```

For direct host development:

```bash
dotnet run --project Services/Payment/Payment.API/Payment.API.csproj
```

## 8. Communication with Other Services

```text
Reservations.API
   |
   | gRPC: create payment / refund
   v
Payment.API
   |
   | Stripe API
   v
Stripe
   |
   | signed webhook
   v
Payment.API
   |
   | RabbitMQ payment.status.changed
   v
Reservations.API
```

### Reservations.API — synchronous gRPC

Internal address in Compose:

```text
http://payment-api:8082
```

Reservations uses it to create PaymentIntents and request refunds.

### Stripe — HTTPS API + webhooks

Payment.API calls Stripe to create/refund payments. Stripe calls the webhook endpoint to report final state changes.

### Reservations.API — asynchronous RabbitMQ status updates

After processing relevant Stripe events, Payment.API publishes payment status messages. Reservations.API consumes them and updates the reservation's payment state.

Payment.API does not send customer emails directly; notification emails are handled by Notifications.API through reservation-domain events.
