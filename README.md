# ReserveNServe

ReserveNServe is a restaurant reservation and food pre-ordering platform built using a **microservices architecture**.

The application allows users to browse restaurants, check table availability, create and manage reservations, pre-order food and drinks, pay online, and receive email notifications related to their reservations.

The system consists of a **Next.js frontend** and multiple **ASP.NET Core microservices**, with Docker Compose used to run the complete application locally.

---

## Main Features

* User registration and authentication
* Email confirmation and password reset
* JWT-based authentication and role-based authorization
* Restaurant browsing and restaurant details
* Menu and cuisine management
* Table and table-group management
* Reservation availability search
* Reservation creation, update, and cancellation
* Food and drink pre-ordering
* Online payments with Stripe
* Refund support for eligible cancelled reservations
* Email notifications
* Unit and end-to-end testing

---

## Architecture

ReserveNServe is divided into independent backend services with clearly separated responsibilities.

| Component             | Responsibility                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Frontend**          | User interface for authentication, restaurants, reservations, pre-orders, and payments                      |
| **Identity.API**      | Users, authentication, JWT tokens, roles, email confirmation, password reset, and restaurant-owner requests |
| **Restaurants.API**   | Restaurants, cuisines, menus, tables, and table groups                                                      |
| **Reservations.API**  | Reservation lifecycle, availability, pre-orders, and coordination with other services                       |
| **Payment.API**       | Stripe payments, payment status, webhooks, and refunds                                                      |
| **Notifications.API** | Transactional email notifications                                                                           |
| **Contracts**         | Shared integration-event contracts used by backend services                                                 |

### Communication

* **REST** between the frontend and backend APIs
* **gRPC** for synchronous service-to-service communication 
* **RabbitMQ** for asynchronous integration events between backend services
* **Stripe** for online payment processing
* **SMTP** for email delivery



A detailed overview of the service architecture and communication flow is available in `docs/architecture.svg`.

---

## Technology Stack

| Area                   | Technology                                     |
| ---------------------- | ---------------------------------------------- |
| Frontend               | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend                | ASP.NET Core, .NET 10                          |
| Authentication         | ASP.NET Core Identity, JWT                     |
| Data Access            | Entity Framework Core                          |
| Databases              | Microsoft SQL Server 2022, PostgreSQL 17       |
| Internal Communication | gRPC                                           |
| Messaging              | RabbitMQ                                       |
| Payments               | Stripe                                         |
| Email                  | MailKit, SMTP, Mailpit                         |
| API Documentation      | Swagger / OpenAPI                              |
| Containerization       | Docker, Docker Compose                         |
| Testing                | xUnit, Moq                                     |

---

## Repository Structure

```text
ReserveNServe/
├── README.md
│
├── docs/
│   ├── architecture.svg
│   └── user-guide.md
│
├── backend/
│   └── ReserveNServeBackend/
│       ├── BuildingBlocks/
│       │   └── Contracts/
│       │
│       ├── Services/
│       │   ├── Identity/
│       │   │   └── README.md
│       │   ├── Restaurants/
│       │   │   └── README.md
│       │   ├── Reservations/
│       │   │   └── README.md
│       │   ├── Payment/
│       │   │   └── README.md
│       │   ├── Notifications/
│       │   |   └── README.md
│       │   └── Tests/
│       | 
│       ├── scripts/
│       ├── compose.yaml
│       ├── .env.example
│       └── ReserveNServeBackend.slnx
│
└── frontend/
    └── README.md
```

Detailed documentation for each microservice is stored in a `README.md` file inside the corresponding service folder.

---

## Getting Started

### Prerequisites

Required:

* Git
* Docker Desktop or Docker Engine with Docker Compose support
* Stripe test credentials

For local backend development:

* .NET SDK 10

For local frontend development outside Docker:

* Node.js

---

### 1. Clone the Repository

```bash
git clone https://github.com/jelisavetagavrilovic/ReserveNServe.git

cd ReserveNServe/backend/ReserveNServeBackend
```

---

### 2. Configure Environment Variables

Create the local `.env` file from the provided example:

```bash
cp .env.example .env
```

Configure the required values, including:

* database passwords
* JWT configuration
* Stripe test keys
* Stripe webhook secret
* RabbitMQ configuration
* HTTPS certificate settings

Do not commit the real `.env` file.

---

### 3. Generate the Development HTTPS Certificate

ReserveNServe includes a script for creating the ASP.NET Core development certificate:

```bash
chmod +x scripts/setup-dev-cert.sh

./scripts/setup-dev-cert.sh
```

The script reads `ASPNETCORE_HTTPS_CERTIFICATE_PASSWORD` from `.env` and creates:

```text
~/.aspnet/https/reservenserve.pfx
```

If necessary, trust the development certificate:

```bash
dotnet dev-certs https --trust
```

Make sure `ASPNET_HTTPS_PATH` in `.env` points to the directory containing the generated certificate.

---

### 4. Start the Application

Build and start all services:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Stop the application:

```bash
docker compose down
```

To remove local Docker volumes and reset development data:

```bash
docker compose down -v
```

---

## Local Development Endpoints

| Component           | Address                                            |
| ------------------- | -------------------------------------------------- |
| Frontend            | `http://localhost:3000`                            |
| Identity API        | `http://localhost:5206`                            |
| Notifications API   | `http://localhost:5200`                            |
| Restaurants API     | `http://localhost:5174` / `https://localhost:7274` |
| Reservations API    | `http://localhost:5040` / `https://localhost:7294` |
| Payment API         | `http://localhost:5175` / `https://localhost:7275` |
| SQL Server          | `localhost:1436`                                   |
| RabbitMQ            | `localhost:5672`                                   |
| RabbitMQ Management | `http://localhost:15672`                           |
| Mailpit             | `http://localhost:8025`                            |

Swagger / OpenAPI documentation for individual APIs is available through each service's Swagger endpoint when the service is running.

---

## Testing

Run the complete backend test suite from:

```text
backend/ReserveNServeBackend
```

using:

```bash
dotnet test ReserveNServeBackend.slnx
```

Tests are organized under the central `Tests/` directory and include:

* unit tests for individual services
* integration-related service tests
* end-to-end tests for complete application flows

---

## Documentation

Project documentation is intentionally divided into general and service-specific documentation.

### General Documentation

Stored in `docs/`:

* `architecture.svg` — visual overview of the system architecture and service communication
* `user-guide.md` — end-user guide for working with the application

### Service Documentation

Each microservice contains its own `README.md` with service-specific information, including:

* purpose
* responsibilities
* project structure
* main API endpoints
* database
* configuration
* how to run the service
* communication with other services

The frontend also contains its own `README.md` with frontend-specific documentation.

This keeps the root documentation concise while allowing each subsystem to be documented in sufficient detail.

---

## Security

Never commit sensitive configuration or credentials, including:

* `.env` files
* database passwords
* JWT signing keys
* Stripe secret keys
* Stripe webhook secrets
* HTTPS certificates
* certificate passwords

Use development or test credentials when running ReserveNServe locally.
