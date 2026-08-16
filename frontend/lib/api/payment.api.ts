import type {
  ReservationResponse,
} from "../types/reservation.types"

import {
  getReservationById,
  updateReservation,
} from "./reservation.api"


// ============================================================================
// MOCK PAYMENT API
// ============================================================================
//
// IMPORTANT:
//
// This file currently simulates the external Payment Service / Stripe flow.
//
// The Reservations API is responsible for:
//
//   - starting payment
//   - storing ReservationPaymentStatus
//   - starting refund when a paid reservation is cancelled
//
// This mock file only simulates what would normally happen asynchronously
// after Stripe / Payment Service processes a payment or refund.
//
// LATER:
//
// Most functions in this file will disappear when the real Payment Service
// and Stripe integration are connected.
//
// Real flow:
//
// Frontend
//    ↓
// POST /api/reservations/{id}/payment
//    ↓
// Reservations Service
//    ↓
// Payment Service
//    ↓
// Stripe
//
// Stripe webhook
//    ↓
// Payment Service
//    ↓
// Reservations Service internal payment-status endpoint
//
// Frontend NEVER directly sets paymentStatus in production.
//
// ============================================================================


const MOCK_PAYMENT_DELAY = 1500


function delay(ms = MOCK_PAYMENT_DELAY) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  )
}


/**
 * TEMPORARY MOCK ONLY.
 *
 * Simulates Stripe / Payment Service reporting that payment succeeded.
 *
 * CURRENT:
 *
 *   Pending
 *      ↓
 *   Succeeded
 *
 * by directly updating our localStorage mock reservation.
 *
 *
 * LATER:
 *
 * DELETE this function.
 *
 * The frontend will use Stripe SDK with the clientSecret returned by:
 *
 *   startReservationPayment(reservationId)
 *
 * Stripe will then send a webhook to Payment Service.
 * Payment Service will notify Reservations Service.
 *
 * Reservations Service becomes the source of truth for:
 *
 *   paymentStatus = Succeeded
 *
 * Frontend should then GET the reservation again.
 */
export async function confirmMockPayment(
  reservationId: string
): Promise<ReservationResponse> {
  const reservation =
    await getReservationById(reservationId)

  if (
    reservation.paymentStatus !== "Pending"
  ) {
    throw new Error(
      "Only a pending payment can be completed"
    )
  }

  await delay()

  // MOCK ONLY:
  // In production frontend must NEVER update
  // paymentStatus directly.
  return updateReservation(
    reservationId,
    {
      paymentStatus: "Succeeded",
    }
  )
}


/**
 * TEMPORARY MOCK ONLY.
 *
 * Simulates Stripe / Payment Service reporting a failed payment.
 *
 * CURRENT:
 *
 *   Pending
 *      ↓
 *   Failed
 *
 *
 * After this, frontend can call:
 *
 *   startReservationPayment(reservationId)
 *
 * again to simulate payment retry.
 *
 *
 * LATER:
 *
 * DELETE this function.
 *
 * Stripe / Payment Service will determine payment failure
 * and Reservations Service will receive:
 *
 *   PaymentFailed
 *
 * through its internal payment status endpoint.
 */
export async function failMockPayment(
  reservationId: string
): Promise<ReservationResponse> {
  const reservation =
    await getReservationById(reservationId)

  if (
    reservation.paymentStatus !== "Pending"
  ) {
    throw new Error(
      "Only a pending payment can fail"
    )
  }

  await delay()

  // MOCK ONLY.
  return updateReservation(
    reservationId,
    {
      paymentStatus: "Failed",
    }
  )
}


/**
 * TEMPORARY MOCK ONLY.
 *
 * Simulates successful refund processing.
 *
 * IMPORTANT:
 *
 * Frontend does NOT start the refund.
 *
 * Refund is started automatically when:
 *
 *   cancelReservation(id)
 *
 * is called for a reservation whose paymentStatus is Succeeded.
 *
 * Mock Reservations API changes:
 *
 *   Confirmed / Succeeded
 *
 * into:
 *
 *   Cancelled / RefundPending
 *
 * This function only simulates Payment Service later reporting:
 *
 *   RefundPending
 *       ↓
 *   Refunded
 *
 *
 * LATER:
 *
 * DELETE this function.
 *
 * Real flow:
 *
 * Reservations Service
 *      ↓
 * Payment Service
 *      ↓
 * Stripe refund
 *      ↓
 * Stripe webhook
 *      ↓
 * Payment Service
 *      ↓
 * Reservations Service
 *
 * Frontend only reads the resulting reservation state.
 */
export async function completeMockRefund(
  reservationId: string
): Promise<ReservationResponse> {
  const reservation =
    await getReservationById(reservationId)

  if (
    reservation.status !== "Cancelled"
  ) {
    throw new Error(
      "Refund can only complete for a cancelled reservation"
    )
  }

  if (
    reservation.paymentStatus !==
    "RefundPending"
  ) {
    throw new Error(
      "Refund is not pending"
    )
  }

  await delay()

  // MOCK ONLY.
  return updateReservation(
    reservationId,
    {
      paymentStatus: "Refunded",
    }
  )
}


/**
 * TEMPORARY MOCK ONLY.
 *
 * Simulates failed refund processing.
 *
 * CURRENT:
 *
 *   Cancelled / RefundPending
 *
 * becomes:
 *
 *   Cancelled / RefundFailed
 *
 *
 * LATER:
 *
 * DELETE this function.
 *
 * Refund failure will be reported by Payment Service
 * to Reservations Service.
 */
export async function failMockRefund(
  reservationId: string
): Promise<ReservationResponse> {
  const reservation =
    await getReservationById(reservationId)

  if (
    reservation.status !== "Cancelled"
  ) {
    throw new Error(
      "Refund can only fail for a cancelled reservation"
    )
  }

  if (
    reservation.paymentStatus !==
    "RefundPending"
  ) {
    throw new Error(
      "Refund is not pending"
    )
  }

  await delay()

  // MOCK ONLY.
  return updateReservation(
    reservationId,
    {
      paymentStatus: "RefundFailed",
    }
  )
}