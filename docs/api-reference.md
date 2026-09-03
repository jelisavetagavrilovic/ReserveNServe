# API Reference

This inventory reflects the controllers and gRPC services in the repository. Swagger/OpenAPI remains the authoritative runtime description of request and response schemas.

`JWT` means an `Authorization: Bearer <access-token>` header is required. Role policies are evaluated from JWT role claims.

## Identity.API

Default base URL: `http://localhost:5206`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public, rate limited | Create a user and publish an email-confirmation event |
| POST | `/api/auth/login` | Public, rate limited | Validate credentials and issue access/refresh tokens |
| POST | `/api/auth/refresh` | Public, rate limited | Rotate a valid refresh token and issue a new token pair |
| POST | `/api/auth/logout` | JWT | Revoke one refresh token |
| POST | `/api/auth/logout-all` | JWT | Revoke all refresh tokens for the current user |
| GET | `/api/auth/me` | JWT | Return current profile and roles |
| PUT | `/api/auth/me` | JWT | Update full name, email, and phone; email change requires confirmation |
| POST | `/api/auth/confirm-email` | Public | Confirm an email with user ID and token |
| POST | `/api/auth/forgot-password` | Public, rate limited | Publish a password-reset event when the account is eligible |
| POST | `/api/auth/reset-password` | Public, rate limited | Apply a valid password-reset token |
| POST | `/api/owners/requests` | JWT | Request the `RestaurantOwner` role |
| GET | `/api/owners/requests` | AdminOnly | List pending owner requests |
| POST | `/api/owners/requests/approve` | AdminOnly | Approve the request identified by email |
| GET | `/api/owners/ping` | OwnerOnly | Verify restaurant-owner authorization |
| GET | `/api/admin/ping` | AdminOnly | Verify administrator authorization |

Important request fields:

- registration: `fullName`, `email`, `phone`, `password`;
- login: `email`, `password`;
- refresh/logout: `refreshToken`;
- confirmation/reset: `userId`, token, and the new password where applicable.

## Restaurants.API

Default base URLs: `http://localhost:5174`, `https://localhost:7274`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/Restaurants/GetRestaurants` | Public | Paginated/filterable restaurant list |
| GET | `/api/Restaurants/GetRestaurants/{id}` | Public | Restaurant card/details data by ID |
| GET | `/api/Restaurants/GetRestaurantInfo/{id}` | Public | Restaurant, opening hours, duration and table groups |
| GET | `/api/Restaurants/GetTable/{id}` | Public | Table-group data by ID |
| GET | `/api/Restaurants/GetMenuForRestaurant/{id}` | Public | Menu items shown to the frontend |
| GET | `/api/Restaurants/GetMenuItemsForRestaurant/{id}` | Public | Menu-item data used by integrations |
| GET | `/api/Restaurants/GetRestaurantsFilters` | Public | Available cuisine and price filters |

`GetRestaurants` accepts query fields such as search, cuisine type, price, sort order, page and page size.

## Reservations.API

Default base URLs: `http://localhost:5040`, `https://localhost:7294`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/reservations` | JWT | Create a reservation and optional order |
| GET | `/api/reservations/{id}` | JWT + owner | Get one owned reservation |
| GET | `/api/reservations` | JWT | Get the current user's filtered, paginated reservations |
| PUT | `/api/reservations/{id}` | JWT + owner | Update date, start time, table group, guest count and serving time |
| PUT | `/api/reservations/{id}/orders` | JWT + owner | Replace the reservation's pre-order |
| POST | `/api/reservations/{id}/payment` | JWT + owner | Start or retry pre-order payment |
| DELETE | `/api/reservations/{id}` | JWT + owner | Cancel and initiate refund when required |
| GET | `/api/reservations/availability/slots` | Public | Return available time slots |
| GET | `/api/reservations/availability/tables` | Public | Return available table groups/counts |

Availability query formats:

```text
/api/reservations/availability/slots?restaurantId=20&date=2026-09-03&guestNumber=2
/api/reservations/availability/tables?restaurantId=20&date=2026-09-03&time=19:30&guestNumber=2
```

Core creation fields are `restaurantId`, `tableGroupId`, `date`, `startTime`, `guestNumber`, optional `servingTime` and optional orders containing `menuItemId` and `quantity`. User ID and contact email are derived from JWT claims, not trusted from the request body.

## Payment.API

Default base URLs: `http://localhost:5175`, `https://localhost:7275`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/Payment/CreatePaymentIntent` | JWT | Create or reuse the PaymentIntent for a reservation |
| POST | `/api/Payment/Refund` | JWT | Request a refund by reservation ID |
| POST | `/api/PaymentWebhook/StripeWebhook` | Stripe signature | Verify and process supported Stripe events |

Reservations.API normally uses Payment.API's gRPC surface. The webhook route must remain public at the network layer so Stripe can reach it, but every payload is authenticated by the `Stripe-Signature` header and configured webhook secret.

## Notifications.API

Default base URL: `http://localhost:5200`

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | Basic service health response |
| POST | `/api/email/test` | Development only | Send one test confirmation email |
| GET | `/api/email/logs` | Development only | Return the 20 newest email audit entries |

Production notification work is event-driven; there is no public "send arbitrary email" production endpoint.

## Internal gRPC operations

Internal gRPC listeners use port `8082` on the Compose network.

| Service | Operation | Caller | Purpose |
| --- | --- | --- | --- |
| Restaurants.API | `GetRestaurantInfo` | Reservations.API | Obtain working hours, duration and table groups |
| Restaurants.API | `GetMenuItems` | Reservations.API | Validate IDs and snapshot menu names/prices |
| Payment.API | `CreatePayment` | Reservations.API | Create/reuse logical payment and Stripe PaymentIntent |
| Payment.API | `RefundPayment` | Reservations.API | Start an idempotent refund and return logical status |

## Common response behavior

- `200 OK`: successful read/update/action.
- `201 Created`: reservation created.
- `202 Accepted`: logout operation accepted.
- `204 No Content`: reservation cancelled successfully.
- `400 Bad Request`: invalid model, business rule, or Stripe signature.
- `401 Unauthorized`: token/credentials missing or invalid.
- `403 Forbidden`: authenticated user lacks the required role/policy.
- `404 Not Found`: requested resource is absent or a development-only endpoint is hidden outside Development.
- `409 Conflict`: duplicate registration or another conflicting state.
- `500 Internal Server Error`: unexpected dependency or processing failure.

Exact behavior can vary by endpoint and domain exception mapping. Use runtime OpenAPI and the service README for implementation-level details.

## Authenticated request example

```bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://localhost:7294/api/reservations?page=1&pageSize=10"
```

Use test credentials only. Never paste access tokens, refresh tokens, JWT signing keys, Stripe secrets, or database passwords into committed documentation.
