# Payment.API

Payment.API is the payment microservice of ReserveNServe. It integrates the backend with Stripe, stores payment records, processes Stripe webhooks, performs refunds and publishes payment-status changes.

## 1. Purpose

The service isolates Stripe-specific logic from the reservation domain. Reservations.API requests payment and refund operations through gRPC, while Stripe webhooks determine the final payment or refund status asynchronously.

## 2. Responsibilities

* Create Stripe PaymentIntents
* Reuse an existing PaymentIntent when appropriate
* Store payment records and their statuses
* Create Stripe refunds
* Verify Stripe webhook signatures
* Process payment success, payment failure and refund events
* Publish payment-status changes to RabbitMQ
* Expose an internal gRPC API to Reservations.API
* Protect public REST payment operations with JWT authentication

## 3. Project Structure

```text
Services/Payment/
├── Payment.API/
│   ├── Controllers/        # Payment and Stripe webhook endpoints
│   ├── Data/               # PaymentsContext
│   ├── Database/           # SQL initialization
│   ├── DTO/                # REST request models
│   ├── Entities/           # Payment entity
│   ├── Enums/              # PaymentStatus
│   ├── Grpc/               # PaymentsGrpcService
│   ├── Handler/            # Payment application logic
│   ├── Messaging/          # RabbitMQ status publisher
│   ├── Protos/             # Payment gRPC contract
│   ├── Repositories/       # Payment persistence
│   ├── Services/           # Stripe integration
│   ├── Program.cs
│   └── Dockerfile
└── Payment.API.Tests/
```

## 4. Main Endpoints

| Method | Endpoint                            | Authorization    | Purpose                                |
| ------ | ----------------------------------- | ---------------- | -------------------------------------- |
| POST   | `/api/Payment/CreatePaymentIntent`  | JWT              | Create or reuse a Stripe PaymentIntent |
| POST   | `/api/Payment/Refund`               | JWT              | Create a Stripe refund                 |
| POST   | `/api/PaymentWebhook/StripeWebhook` | Stripe signature | Process Stripe webhook events          |

The normal checkout workflow does not call Payment.API directly from the browser. Reservations.API uses the internal Payment gRPC API.

Swagger is available in the Development environment at `https://localhost:7275/swagger`.

## 5. Database

Payment.API uses **SQL Server** through **Entity Framework Core**.

The main table is `Payments`.

| Column           | Purpose                         |
| ---------------- | ------------------------------- |
| `id`             | Primary key                     |
| `reservation_id` | Reservation identifier          |
| `payment_intent` | Stripe PaymentIntent identifier |
| `status`         | Internal payment status         |

The payment schema is initialized through:

```text
Payment.API/Database/init.sql
```

Docker Compose runs the initialization through the `payment-db-init` service.

The current initialization script contains `USE Payment`. Therefore, the Docker configuration should keep:

```dotenv
PAYMENT_DB_NAME=Payment
```

Changing the database name also requires updating the initialization script.

## 6. Configuration

| Variable group                                                                    | Purpose                                 |
| --------------------------------------------------------------------------------- | --------------------------------------- |
| `MSSQL_SA_PASSWORD`                                                               | SQL Server administrator password       |
| `PAYMENT_DB_NAME`, `PAYMENT_DB_USER`, `PAYMENT_DB_PASSWORD`                       | Payment database connection             |
| `PAYMENT_HTTP_PORT`, `PAYMENT_HTTPS_PORT`                                         | Host ports used by Docker Compose       |
| `PAYMENT_STRIPE_SECRET_KEY`                                                       | Stripe server-side API key              |
| `PAYMENT_STRIPE_WEBHOOK_SECRET`                                                   | Stripe webhook-signature secret         |
| `PAYMENT_RABBITMQ_HOST`, `PAYMENT_RABBITMQ_USERNAME`, `PAYMENT_RABBITMQ_PASSWORD` | RabbitMQ connection                     |
| `JWT_ISSUER`, `JWT_AUDIENCE`, `JWT_KEY`                                           | JWT validation shared with Identity.API |

Internal container ports are:

```text
REST HTTP : 8080
REST HTTPS: 8081
gRPC      : 8082
```

The gRPC port is available only inside the Docker network.

Stripe secret keys must remain server-side and must never be placed in `NEXT_PUBLIC_*` variables.

## 7. How to Run

Configure the root `.env` file and development certificate as described in the [Setup and Run Guide](../../../../docs/setup-and-run.md).

From `backend/ReserveNServeBackend`, run:

```bash
docker compose up -d --build \
  sqlserver rabbitmq payment-db-init payment-api
```

For local Stripe webhooks, run Stripe CLI on the host:

```bash
stripe listen \
  --events payment_intent.succeeded,payment_intent.payment_failed,refund.created,refund.updated,refund.failed \
  --forward-to http://localhost:5175/api/PaymentWebhook/StripeWebhook
```

Copy the generated `whsec_...` value to `PAYMENT_STRIPE_WEBHOOK_SECRET` and restart Payment.API.

For direct host development:

```bash
dotnet run --project Services/Payment/Payment.API/Payment.API.csproj
```

## 8. Communication with Other Services

| Direction | Component        | Mechanism                         | Purpose                                      |
| --------- | ---------------- | --------------------------------- | -------------------------------------------- |
| Inbound   | Reservations.API | gRPC at `http://payment-api:8082` | Create PaymentIntents and request refunds    |
| Outbound  | Stripe           | HTTPS API                         | Create and manage PaymentIntents and refunds |
| Inbound   | Stripe           | Signed webhook                    | Receive final payment and refund statuses    |
| Outbound  | Reservations.API | RabbitMQ                          | Publish `payment.status.changed` messages    |

After receiving a Stripe webhook, Payment.API publishes the new status. Reservations.API consumes the message and updates its reservation record.

Payment.API does not send customer emails directly. Notifications are triggered by reservation-domain events published by Reservations.API.

## Related Project Documentation

* [Payment class diagram](../../../../docs/class-diagrams.md#payment-subsystem)
* [Payment and refund flows](../../../../docs/architecture.md#reservation-with-pre-order-and-payment)
* [Payment API reference](../../../../docs/api-reference.md#paymentapi)
* [Source-code documentation](../../../../docs/source-code.md)
