# ReserveNServe Frontend
The ReserveNServe frontend is the web client for the ReserveNServe restaurant reservation platform.
It is built with **Next.js 16**, **React 19**, **TypeScript**, **Zustand**, and **Stripe Elements**.

## 1. Purpose
The frontend provides the user interface for the ReserveNServe system.
It allows users to:
- register and log in;
- browse restaurants;
- view restaurant details and menus;
- check available reservation slots and tables;
- create reservations;
- preorder food;
- pay by card using Stripe;
- view reservation confirmation;
- manage bookings;
- update account information.

## 2. Responsibilities
### Authentication
- registration and login;
- email confirmation;
- password reset;
- access and refresh token handling;
- restoring authentication state;
- protecting authenticated pages.
### Restaurant browsing
- loading restaurant lists;
- displaying restaurant details;
- displaying menus, cuisine, location, images, and opening hours.
### Reservations
- selecting date, time, and guest count;
- loading available slots;
- loading available tables;
- creating reservations;
- displaying reservation confirmation;
- listing and cancelling reservations.
### Food and drinks preorder
- displaying menu items;
- maintaining the preorder cart;
- sending selected items with the reservation workflow.
### Payments
- requesting payment initialization through `Reservations.API`;
- rendering Stripe Elements;
- confirming payment with Stripe.js;
- polling reservation/payment state until backend webhook processing is completed.
### Account and administration
- viewing and updating the user profile;
- changing email.

## 3. Project Structure
The frontend is located in:
```text
frontend/
```
Main structure:
```text
frontend/
├── app/
│   ├── account/
│   ├── admin/
│   ├── auth/
│   ├── bookings/
│   ├── checkout/
│   ├── confirmation/
│   ├── menu/
│   ├── restaurants/
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── auth/
├── components/
├── lib/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utilities/
├── public/
├── Dockerfile
├── package.json
└── .env.local
```
| Folder | Responsibility |
|---|---|
| `app/` | Next.js App Router pages and layouts |
| `auth/` | Authentication services, store, and hooks |
| `components/` | Reusable UI and application components |
| `lib/services/` | Backend API clients |
| `lib/stores/` | Reservation/cart workflow state |
| `lib/types/` | TypeScript models |
| `public/` | Static assets |

## 4. Main Routes
The frontend exposes web routes rather than REST endpoints.
| Route | Purpose |
|---|---|
| `/` | Home page |
| `/restaurants` | Restaurant list |
| `/restaurants/[id]` | Restaurant details |
| `/menu` | Food preorder |
| `/checkout` | Stripe payment |
| `/confirmation` | Reservation confirmation |
| `/bookings` | User reservations |
| `/account` | User profile |
| `/auth/login` | Login |
| `/auth/register` | Registration |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password` | Password reset |
| `/admin/*` | Administration workflows |
The frontend mainly consumes REST endpoints from:
- `Identity.API`
- `Restaurants.API`
- `Reservations.API`
The browser does **not** call `Payment.API` directly.

## 5. State and Data Storage
The frontend has no database.
Persistent business data is stored by backend services.
Client-side state is managed with **Zustand**.
Important state includes:
- authentication information;
- current user;
- selected restaurant;
- reservation date and time;
- guest count;
- selected table;
- selected menu items;
- reservation ID;
- payment workflow state.
Some state is persisted in browser storage so the reservation flow can survive navigation and page reloads.
Authentication uses:
- JWT access token;
- refresh token.
The access token is attached to protected backend requests.

## 6. Configuration
Create:
```text
frontend/.env.local
```
Example:
```env
NEXT_PUBLIC_IDENTITY_API_URL=http://localhost:5206
NEXT_PUBLIC_RESTAURANTS_API_URL=https://localhost:7274
NEXT_PUBLIC_RESERVATIONS_API_URL=https://localhost:7294
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
HTTP alternatives:
```env
NEXT_PUBLIC_RESTAURANTS_API_URL=http://localhost:5174
NEXT_PUBLIC_RESERVATIONS_API_URL=http://localhost:5040
```
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_IDENTITY_API_URL` | Identity service URL |
| `NEXT_PUBLIC_RESTAURANTS_API_URL` | Restaurants service URL |
| `NEXT_PUBLIC_RESERVATIONS_API_URL` | Reservations service URL |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public browser key |
Do not put secret keys in `NEXT_PUBLIC_*` variables.
When building the Docker image, make sure `NEXT_PUBLIC_IDENTITY_API_URL` is also passed as a build argument.

## 7. How to Run
### Requirements
Install:
- Node.js;
- npm;
- Docker Desktop if the backend is run with Docker.
For the complete application flow, the backend services and infrastructure should be running.
### Run locally
```bash
cd frontend
npm install
npm run dev
```
Open:
```text
http://localhost:3000
```
### Production build
```bash
npm run build
npm start
```
### Run with Docker Compose
From the repository root:
```bash
docker compose up --build
```
The frontend is available at:
```text
http://localhost:3000
```
Recommended development setup:
```text
Backend services and databases -> Docker Compose
Frontend                       -> npm run dev
```

## 8. Communication with Other Services
The frontend communicates with backend services through REST APIs.

### Identity.API
Used for:
- registration;
- login;
- token refresh;
- logout;
- email confirmation;
- password reset;
- profile management;
- RestaurantOwner/admin workflows.
Typical local URL:
```text
http://localhost:5206
```
### Restaurants.API
Used for:
- restaurant listing;
- restaurant details;
- menu data;
- restaurant metadata.
Typical local URLs:
```text
https://localhost:7274
http://localhost:5174
```
### Reservations.API
Used for:
- available slots;
- available tables;
- reservation creation;
- preorder handling;
- bookings;
- cancellations;
- payment initialization;
- payment-status reconciliation.
Typical local URLs:
```text
https://localhost:7294
http://localhost:5040
```

## Summary
The ReserveNServe frontend is the presentation and workflow layer of the platform.
Main user flow:
```text
Authentication
-> Restaurant selection
-> Availability
-> Reservation
-> Optional food preorder
-> Stripe payment
-> Confirmation
-> Booking management
```
Business rules, persistence, payment processing, and notifications remain in backend microservices.
