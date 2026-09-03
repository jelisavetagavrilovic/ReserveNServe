# ReserveNServe User Guide

ReserveNServe lets guests discover restaurants and lets registered users reserve a table, optionally pre-order food and drinks, pay securely and manage their bookings.

## User roles

| Role | Available actions |
| --- | --- |
| Guest | Open the home page, browse and filter restaurants, view restaurant details and menus and check public availability |
| User | All guest actions plus booking, pre-ordering, payment, account management, cancellations and restaurant-owner access requests |
| Restaurant Owner | A user whose owner request has been approved; the role is present in the current system even though restaurant-management pages are outside the current frontend scope |
| Admin | Review and approve pending restaurant-owner requests |

## 1. Create and confirm an account

1. Open ReserveNServe and select **Create Account** or **Register**.
2. Enter your full name, email address, optional phone number, and password.
3. Submit the form.
4. Open the confirmation email and follow its link.
5. After the confirmation page reports success, continue to **Login**.

The password must contain at least eight characters and at least one number. A user cannot sign in until the email address has been confirmed.

In the local development environment, outgoing email is captured by Mailpit. Open `http://localhost:8025` to read the confirmation message instead of checking a real mailbox.

## 2. Sign in and recover access

### Sign in

1. Open **Login**.
2. Enter the confirmed email address and password.
3. Select **Sign In**.

The application keeps the current session in the browser. Its authentication service supports refresh-token rotation when that operation is invoked. Selecting **Logout** revokes the active refresh token and removes the local session.

### Forgotten password

1. Select **Forgot password?** on the login page.
2. Enter the account email address.
3. Open the password-reset email.
4. Follow the reset link and enter a new password.
5. Return to the login page.

For privacy, the password-reset request returns the same general response whether or not an account exists for the entered address.

## 3. Find a restaurant

1. Open **Restaurants** from the home page or navigation.
2. Use the search field to filter by restaurant name or location.
3. Use cuisine and price filters when needed.
4. Change the sort order or browse additional pages.
5. Select a restaurant card to open its details.

The details page shows the restaurant description, address, opening hours, rating, cuisine, price range, reservation controls, and a menu preview.

## 4. Check availability

On a restaurant details page:

1. Choose a reservation date.
2. Enter the number of guests.
3. Select one of the available 30-minute start times.
4. Choose an available table group that has enough seats.

Availability is calculated from the restaurant's working hours, reservation duration, table-group capacity, table count and active overlapping reservations. For the current date, elapsed time slots are not offered.

## 5. Book without a pre-order

1. Complete the date, guest, time and table selection.
2. Select **Book Table** or **Book Without Pre-order**.
3. Sign in if the application redirects you to the login page.
4. Confirm the reservation details.

The reservation is created as confirmed and no payment is required. The confirmation page displays the booking summary, and a reservation confirmation email is sent asynchronously.

## 6. Book with a food or drink pre-order

1. Complete the reservation selection on the restaurant page.
2. Continue to the restaurant menu.
3. Add items and quantities to the cart.
4. Review the total and serving time.
5. Continue to checkout.
6. Verify the reservation and order summary.
7. Enter test or real card details in the Stripe payment form, depending on the configured environment.
8. Submit payment and wait for the final status.

The table reservation and order are stored before payment begins. Stripe processes the card; its signed webhook updates Payment.API; Payment.API publishes the logical payment status; Reservations.API updates the reservation; and the confirmation email is sent only after successful payment.

Do not close or repeatedly refresh the page while a payment is shown as processing. The frontend briefly polls the reservation to reconcile the final webhook-driven status.

## 7. View and manage bookings

Open **My Bookings** from the account or navigation area. Bookings are separated into upcoming and past groups.

Each booking card can show:

- restaurant name and location;
- reservation date and time;
- table location and party size;
- food and drink pre-order;
- reservation status;
- payment or refund status;
- total amount.

The current **My Bookings** interface focuses on viewing and cancellation. The backend API also supports changing an allowed future reservation or its orders before payment is final; those operations are available for frontend extension. Such a change resets an unpaid or failed payment state so payment can be started again with the new total.

## 8. Cancel a reservation and receive a refund

1. Open **My Bookings**.
2. Find an upcoming reservation.
3. Select **Cancel**.
4. Confirm the cancellation dialog.

A confirmed future reservation cannot be cancelled while a payment or refund is actively pending.

- If no payment was required, the reservation is cancelled and a cancellation email is sent.
- If payment succeeded, cancellation starts a Stripe refund. The booking first shows a pending refund and later changes to refunded or refund failed after the Stripe webhook is processed.
- A successful refund produces a separate refund email and can include the Stripe receipt URL.

## 9. Manage the account

Open **Account Settings** to review or change the profile.

- Change the full name, email address, or phone number.
- If the email address changes, the new address must be confirmed before the next successful login.
- Use logout to end the current session.

## 10. Request Restaurant Owner access

A signed-in user can request the `RestaurantOwner` role from **Account Settings**.

1. Open the restaurant-owner section.
2. Select the request button.
3. Wait for an administrator to review the request.
4. After approval, sign in again or refresh the session so the new role is represented in the token.

An administrator reviews requests at `/admin/owner-requests`. Approval assigns the role and triggers an email to the requester.

## Email notifications

| Event | Expected message |
| --- | --- |
| Registration or email change | Email confirmation link |
| Forgotten password | Password-reset link |
| Owner request processed | Approval result |
| Reservation without pre-order | Reservation confirmation |
| Successful pre-order payment | Reservation and order confirmation, optionally with receipt URL |
| Reservation cancellation | Cancellation confirmation and whether a refund is expected |
| Successful refund | Refund confirmation, optionally with receipt URL |

## Status reference

### Reservation status

| Status | Meaning |
| --- | --- |
| Confirmed | The table reservation is active |
| Cancelled | The user cancelled the reservation |
| Completed | The reservation end time has passed and the reservation was completed |

### Payment status

| Status | Meaning |
| --- | --- |
| NotRequired | There is no paid pre-order |
| NotStarted | Pre-order exists, but payment has not started |
| Pending | Stripe payment is processing |
| Succeeded | Payment completed |
| Failed | Payment failed and may be retried |
| RefundPending | Refund processing is underway |
| Refunded | Refund completed |
| RefundFailed | Refund failed and requires another attempt or support action |

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Confirmation or reset email is missing locally | Open Mailpit at `http://localhost:8025`; then check the Notifications API logs |
| Login says the email is not confirmed | Follow the newest confirmation link; older tokens may no longer apply after an email change |
| No time slots appear | Verify the date is not in the past, party size is positive and the restaurant has a suitable table group during working hours |
| Payment remains pending | Wait briefly for the Stripe webhook; a developer should check the Stripe listener, Payment API, RabbitMQ and Reservations API logs |
| Browser reports a certificate warning | Trust the local ASP.NET certificate or use the documented HTTP endpoint where available |
| Cancellation is unavailable | Confirm the reservation has not started and that payment/refund is not currently pending |

Developer-oriented diagnostics are available in the [setup and run guide](setup-and-run.md#troubleshooting).
