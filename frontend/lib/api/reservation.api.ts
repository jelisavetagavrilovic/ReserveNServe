import type {
  ReservationRequest,
  ReservationResponse,
  OrderResponse,
} from "../types/reservation.types"

const STORAGE_KEY = "reservations"

function loadReservations(): ReservationResponse[] {
  if (typeof window === "undefined") return []

  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveReservations(reservations: ReservationResponse[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations))
}

export async function getReservationsForUser(): Promise<ReservationResponse[]> {
  return loadReservations()
}

export async function getReservationById(
  id: string
): Promise<ReservationResponse | undefined> {
  return loadReservations().find((reservation) => reservation.id === id)
}

export async function createReservation(
  request: ReservationRequest
): Promise<ReservationResponse> {
  const orders: OrderResponse[] = request.orders.map((order) => ({
    menuItemId: order.menuItemId,
    foodName: "Mock Food",
    price: 10,
    quantity: order.quantity,
    total: order.quantity * 10,
  }))

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0)

  const reservation: ReservationResponse = {
    id: crypto.randomUUID(),

    restaurantId: request.restaurantId,
    restaurantName: "Mock Restaurant",
    restaurantAddress: "Mock Address",
    restaurantCity: "Mock City",

    tableGroupId: request.tableGroupId,
    tableLocation: "Indoor",
    tableSeats: 4,

    date: request.date,
    startTime: request.startTime,
    guestNumber: request.guestNumber,

    servingTime: request.servingTime,
    totalAmount,
    orders,

    status: orders.length ? "PendingPayment" : "Confirmed",
    emailStatus: orders.length ? "Pending" : "Sent",
  }

  const reservations = loadReservations()
  reservations.push(reservation)
  saveReservations(reservations)

  return reservation
}

export async function updateReservation(
  id: string,
  data: Partial<ReservationResponse>
): Promise<ReservationResponse | undefined> {
  const reservations = loadReservations()

  const index = reservations.findIndex((reservation) => reservation.id === id)

  if (index === -1) return undefined

  reservations[index] = {
    ...reservations[index],
    ...data,
  }

  saveReservations(reservations)

  return reservations[index]
}

export async function updateReservationOrders(
  id: string,
  request: ReservationRequest
): Promise<ReservationResponse | undefined> {
  const orders: OrderResponse[] = request.orders.map((order) => ({
    menuItemId: order.menuItemId,
    foodName: "Mock Food",
    price: 10,
    quantity: order.quantity,
    total: order.quantity * 10,
  }))

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0)

  return updateReservation(id, {
    orders,
    totalAmount,
    servingTime: request.servingTime,
    status: orders.length ? "PendingPayment" : "Confirmed",
  })
}

export async function deleteReservation(id: string): Promise<boolean> {
  const reservations = loadReservations()

  saveReservations(
    reservations.filter((reservation) => reservation.id !== id)
  )

  return true
}

export async function cancelReservation(
  id: string
): Promise<ReservationResponse | undefined> {
  return updateReservation(id, {
    status: "Cancelled",
  })
}

export async function sendConfirmationEmail(
  reservation: ReservationResponse
): Promise<boolean> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Email sent for reservation:", reservation.id)

    return true
  } catch (error) {
    console.error("Email failed:", error)
    return false
  }
}

// export async function processPayment(
//   request: PaymentRequest
// ): Promise<ReservationResponse | undefined> {
//   return new Promise((resolve, reject) => {
//     setTimeout(async () => {
//       const paymentSuccessful = true

//       if (!paymentSuccessful) {
//         await updateReservation(request.reservationId, {
//           status: "Failed",
//         })

//         reject(new Error("Payment failed"))
//         return
//       }

//       const reservation = await getReservationById(
//         request.reservationId
//       )

//       if (!reservation) {
//         reject(new Error("Reservation not found"))
//         return
//       }

//       const emailSent = await sendConfirmationEmail(
//         reservation
//       )

//       const updated = await updateReservation(
//         request.reservationId,
//         {
//           status: "Confirmed",
//           emailStatus: emailSent ? "Sent" : "Failed",
//         }
//       )

//       resolve(updated)
//     }, 2000)
//   })
// }
