import type { ReservationResponse } from "../types/reservation.types"
import { getReservationById } from "./reservation.api"

const POLL_DELAY = 500
const MAX_ATTEMPTS = 20

function delay(ms = POLL_DELAY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// PAYMENT
// ============================================================================

export type PaymentProviderOutcome = "succeeded" | "failed"

export async function reconcilePaymentStatus(
  reservationId: string,
  _outcome: PaymentProviderOutcome
): Promise<ReservationResponse> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const reservation = await getReservationById(reservationId)

    if (
      reservation.paymentStatus === "Succeeded" ||
      reservation.paymentStatus === "Failed"
    ) {
      return reservation
    }

    if (reservation.paymentStatus !== "Pending") {
      return reservation
    }

    await delay()
  }

  return getReservationById(reservationId)
}

// ============================================================================
// REFUND
// ============================================================================

export type RefundProviderOutcome = "succeeded" | "failed"

export async function reconcileRefundStatus(
  reservationId: string,
  _outcome: RefundProviderOutcome
): Promise<ReservationResponse> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const reservation = await getReservationById(reservationId)

    if (
      reservation.paymentStatus === "Refunded" ||
      reservation.paymentStatus === "RefundFailed"
    ) {
      return reservation
    }

    if (reservation.paymentStatus !== "RefundPending") {
      return reservation
    }

    await delay()
  }

  return getReservationById(reservationId)
}