import type { ReservationResponse } from "../types/reservation.types"
import {
  getReservationById,
  updateReservation,
  sendConfirmationEmail,
} from "./reservation.api"

export async function createPaymentIntent(
  reservationId: string
): Promise<{ clientSecret: string }> {
  const reservation = await getReservationById(
    reservationId
  )

  if (!reservation) {
    throw new Error("Reservation not found")
  }

  await new Promise((resolve) =>
    setTimeout(resolve, 1000)
  )

  return {
    clientSecret: "pi_3TnmJNEQ4S80Rhls1BoTHO67_secret_R7ZbXD8eFbbtlE59tzFKT0OF9",
  }
}

export async function confirmPayment(
  reservationId: string,
  paymentIntentId: string
): Promise<ReservationResponse | undefined> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const reservation = await getReservationById(
        reservationId
      )

      if (!reservation) {
        reject(new Error("Reservation not found"))
        return
      }

      console.log(
        "Payment confirmed with intent:",
        paymentIntentId
      )

      const emailSent =
        await sendConfirmationEmail(reservation)

      const updated = await updateReservation(
        reservationId,
        {
          status: "Confirmed",
          emailStatus: emailSent ? "Sent" : "Failed",
        }
      )

      resolve(updated)
    }, 1500)
  })
}

export async function refundPayment(
  reservationId: string
): Promise<ReservationResponse | undefined> {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const reservation =
        await getReservationById(reservationId)

      if (!reservation) {
        reject(new Error("Reservation not found"))
        return
      }

      if (reservation.status !== "Confirmed") {
        reject(
          new Error(
            "Only paid reservations can be refunded"
          )
        )
        return
      }

      const updated =
        await updateReservation(
          reservationId,
          {
            status: "Cancelled",
          }
        )

      resolve(updated)
    }, 1500)
  })
}