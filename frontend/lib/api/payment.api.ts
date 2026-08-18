import type {
  ReservationResponse,
} from "../types/reservation.types"

import {
  getReservationById,
  updateReservation,
} from "./reservation.api"


// ============================================================================
// PAYMENT SERVICE
// ============================================================================
//
// IMPORTANT:
//
// Components use ONLY the public functions exported from this file.
//
// TODAY:
//
// These functions simulate asynchronous Payment Service / Stripe callbacks
// by updating the local mock reservation.
//
// LATER:
//
// The public function signatures stay the same.
//
// Their implementation will stop updating local state and will instead
// read the reservation state from the real Reservations API after
// Payment Service / Stripe webhooks have updated it.
//
// Components do NOT change.
// ============================================================================


const MOCK_PAYMENT_DELAY = 1500


function delay(ms = MOCK_PAYMENT_DELAY) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  )
}


// ============================================================================
// PAYMENT
// ============================================================================


export type PaymentProviderOutcome =
  | "succeeded"
  | "failed"


/**
 * Synchronizes the reservation after Stripe finishes
 * processing a payment attempt.
 *
 *
 * TODAY — MOCK:
 *
 * Stripe result
 *      ↓
 * reconcilePaymentStatus()
 *      ↓
 * directly updates local mock reservation
 *
 *
 * LATER — REAL:
 *
 * Stripe result
 *      ↓
 * Stripe webhook
 *      ↓
 * Payment Service
 *      ↓
 * Reservations Service
 *
 * reconcilePaymentStatus() will only wait for / reload
 * the resulting reservation state.
 *
 *
 * IMPORTANT:
 *
 * The component never directly sets paymentStatus.
 */
export async function reconcilePaymentStatus(
  reservationId: string,
  outcome: PaymentProviderOutcome
): Promise<ReservationResponse> {
  const reservation =
    await getReservationById(
      reservationId
    )


  if (
    reservation.paymentStatus !==
    "Pending"
  ) {
    throw new Error(
      "Only a pending payment can be reconciled"
    )
  }


  await delay()


  /*
   * MOCK ONLY.
   *
   * In production this function must NEVER
   * update paymentStatus directly.
   *
   * The backend will already contain the
   * status received from Payment Service.
   */
  return updateReservation(
    reservationId,
    {
      paymentStatus:
        outcome === "succeeded"
          ? "Succeeded"
          : "Failed",
    }
  )
}


// ============================================================================
// REFUND
// ============================================================================


export type RefundProviderOutcome =
  | "succeeded"
  | "failed"


/**
 * Synchronizes the reservation after the external
 * Payment Service finishes processing a refund.
 *
 *
 * TODAY — MOCK:
 *
 * RefundPending
 *      ↓
 * reconcileRefundStatus()
 *      ↓
 * Refunded / RefundFailed
 *
 *
 * LATER — REAL:
 *
 * Stripe refund
 *      ↓
 * webhook
 *      ↓
 * Payment Service
 *      ↓
 * Reservations Service
 *
 * Frontend only reloads the resulting state.
 */
export async function reconcileRefundStatus(
  reservationId: string,
  outcome: RefundProviderOutcome
): Promise<ReservationResponse> {
  const reservation =
    await getReservationById(
      reservationId
    )


  if (
    reservation.status !==
    "Cancelled"
  ) {
    throw new Error(
      "Refund can only be reconciled for a cancelled reservation"
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


  /*
   * MOCK ONLY.
   *
   * In production the Reservations Service
   * will already contain this state.
   */
  return updateReservation(
    reservationId,
    {
      paymentStatus:
        outcome === "succeeded"
          ? "Refunded"
          : "RefundFailed",
    }
  )
}