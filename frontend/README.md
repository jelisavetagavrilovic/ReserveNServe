# ReserveNServe Frontend

The ReserveNServe frontend is the web client for the ReserveNServe restaurant reservation and food pre-ordering platform.

It is built with **Next.js 16**, **React 19**, **TypeScript**, **Zustand**, **Tailwind CSS** and **Stripe Elements**.

## 1. Purpose

The frontend provides the browser interface for authentication, restaurant discovery, reservations, food pre-orders, payments, booking management and account administration.

## 2. Responsibilities

| Area                | Responsibilities                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Authentication      | Registration, login, email confirmation, password reset, token handling and protected-page access                                 |
| Restaurant browsing | Restaurant lists, details, menus, cuisines, locations, images and opening hours                                                   |
| Reservations        | Availability search, table selection, reservation creation, confirmation, listing and cancellation                                |
| Food pre-orders     | Menu display, cart management, and submission of selected items                                                                    |
| Payments            | Payment initialization through `Reservations.API`, Stripe Elements rendering, card confirmation and payment-status reconciliation |
| Account management  | Viewing and updating account information                                                                                           |
| Administration      | Processing restaurant-owner requests through protected administration pages                                                        |

## 3. Project Structure

The frontend is located in the `frontend/` directory.

```text
frontend/
├── app/
│   ├── account/
│   ├── admin/
│   ├── bookings/
│   ├── checkout/
│   ├── confirmation/
│   ├── restaurants/
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── auth/
│   ├── api/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── types/
│   └── utils/
├── components/
│   └── ui/
├── lib/
│   ├── api/
│   ├── services/
│   ├── types/
│   └── store.ts
├── public/
├── Dockerfile
├── package.json
└── .env.local.example
```

| Path            | Responsibility                                               |
| --------------- | ------------------------------------------------------------ |
| `app/`          | Next.js App Router pages, layouts, and providers             |
| `auth/`         | Authentication API client, service, store, hooks and models |
| `components/`   | Reusable application and user-interface components           |
| `lib/api/`      | Low-level backend API clients                                |
| `lib/services/` | Frontend service functions used by pages and components      |
| `lib/store.ts`  | Persisted reservation and cart workflow state                |
| `lib/types/`    | Shared TypeScript models                                     |
| `public/`       | Static assets                                                |

## 4. Main Routes

The frontend exposes browser routes rather than REST endpoints.

| Route                    | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `/`                      | Home page                                     |
| `/restaurants`           | Restaurant list                               |
| `/restaurants/[id]`      | Restaurant details and availability selection |
| `/restaurants/[id]/menu` | Food and drink pre-order                      |
| `/checkout`              | Reservation review and Stripe payment         |
| `/confirmation`          | Reservation confirmation                      |
| `/bookings`              | User reservation management                   |
| `/account`               | User account                                  |
| `/login`                 | Login                                         |
| `/register`              | Registration                                  |
| `/check-email`           | Email-confirmation instructions               |
| `/confirm-email`         | Email confirmation                            |
| `/forgot-password`       | Password-reset request                        |
| `/reset-password`        | Password reset                                |
| `/admin/owner-requests`  | Restaurant-owner request administration       |

## 5. State and Data Storage

The frontend does not have its own database. Persistent business data is stored by the backend services.

Reservation and cart state is managed with **Zustand** and persisted in browser storage. This allows the reservation workflow to survive navigation and page reloads.

The stored workflow state includes:

* Current user
* Selected table
* Reservation request and response
* Selected menu items
* Payment workflow information

Authentication state is managed separately and includes:

* JWT access token
* Refresh token
* Token expiration time
* Current user

The access token is attached to protected backend requests.

## 6. Configuration

Create the local environment file from the supplied example:

```bash
cd frontend
cp .env.local.example .env.local
```

Configure the following values:

```env
NEXT_PUBLIC_IDENTITY_API_URL=http://localhost:5206
NEXT_PUBLIC_RESTAURANTS_API_URL=https://localhost:7274
NEXT_PUBLIC_RESERVATIONS_API_URL=https://localhost:7294
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

HTTP alternatives can be used when HTTPS is not enabled:

```env
NEXT_PUBLIC_RESTAURANTS_API_URL=http://localhost:5174
NEXT_PUBLIC_RESERVATIONS_API_URL=http://localhost:5040
```

| Variable                             | Purpose                        |
| ------------------------------------ | ------------------------------ |
| `NEXT_PUBLIC_IDENTITY_API_URL`       | Base URL of `Identity.API`     |
| `NEXT_PUBLIC_RESTAURANTS_API_URL`    | Base URL of `Restaurants.API`  |
| `NEXT_PUBLIC_RESERVATIONS_API_URL`   | Base URL of `Reservations.API` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable browser key |

Variables whose names begin with `NEXT_PUBLIC_` are included in the browser bundle. Never store Stripe secret keys, database credentials, JWT signing keys, or other secrets in these variables.

When building the Docker image, these values are provided as build arguments through Docker Compose.

## 7. How to Run

### Requirements

For local frontend development, install:

* Node.js 22
* npm

The backend services must also be running for the complete application workflow.

### Run Locally

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

### Create a Production Build

```bash
npm run build
npm start
```

### Run with Docker Compose

From the repository root:

```bash
cd backend/ReserveNServeBackend
docker compose up --build -d
docker compose ps
```

The frontend is available at `http://localhost:3000`.

To stop the application without removing local data:

```bash
docker compose down
```

For environment setup, certificates, Stripe configuration, and troubleshooting, see the [Setup and Run Guide](../docs/setup-and-run.md).

## 8. Communication with Other Services

The frontend communicates with backend services through REST APIs and uses Stripe.js for browser-side card confirmation.

| Component          | Mechanism          | Purpose                                                                                                  |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------------------------- |
| `Identity.API`     | REST/JSON          | Registration, login, tokens, email confirmation, password reset, profile management, and administration  |
| `Restaurants.API`  | REST/JSON          | Restaurant lists, details, menus, filters, opening hours, and table information                          |
| `Reservations.API` | REST/JSON with JWT | Availability, reservations, pre-orders, cancellations, payment initialization and status reconciliation |
| Stripe             | Stripe.js          | Card confirmation using the client secret returned through `Reservations.API`                            |

The browser does not call `Payment.API`, `Notifications.API`, RabbitMQ or the databases directly. Business rules, persistence, payment processing and notification delivery remain in the backend services.
