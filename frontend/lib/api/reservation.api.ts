import { parse, isPast } from "date-fns"
import type {
  ReservationRequest,
  ReservationResponse,
  OrderResponse,
} from "../types/reservation.types"

import type {
  ReservationQueryRequest,
  ReservationListResponse,
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

export async function getReservationsForUser(
  request?: ReservationQueryRequest
): Promise<ReservationListResponse> {
  let reservations = loadReservations()

  if (request?.type) {
    reservations = reservations.filter((reservation) => {
      const reservationDate = parse(
        `${reservation.date} ${reservation.startTime}`,
        "yyyy-MM-dd HH:mm",
        new Date()
      )

      return request.type === "upcoming"
        ? !isPast(reservationDate) &&
            reservation.status !== "Cancelled"
        : isPast(reservationDate) &&
            reservation.status !== "Cancelled"
    })
  }

  const page = request?.page ?? 1
  const pageSize = request?.pageSize ?? 5

  const totalCount = reservations.length
  const totalPages = Math.ceil(totalCount / pageSize)

  const start = (page - 1) * pageSize
  const end = start + pageSize

  const items = reservations.slice(start, end)

  return {
    items,
    page,
    pageSize,
    totalCount,
    totalPages,
  }
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
