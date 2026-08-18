import type {
  ReservationRequest,
  ReservationResponse,
  ReservationQueryRequest,
  ReservationListResponse,
  OrderResponse,
  UpdateReservationOrdersRequest,
  StartPaymentResponse,
} from "../types/reservation.types"

import {
  mockRestaurants,
  mockTables,
  mockMenuItems,
} from "../mock-data"

// ============================================================================
// MOCK RESERVATIONS API
// ============================================================================
//
// IMPORTANT:
//
// This file currently simulates the Reservations backend by using localStorage.
//
// Later, when frontend and backend are connected:
//
//   localStorage          -> HTTP requests to Reservations.API
//   mockRestaurants       -> data returned by Restaurant Service
//   mockTables            -> data returned by Restaurant Service
//   mockMenuItems         -> data returned by Restaurant Service
//
// Components should NOT need to change when the real backend is connected.
// Only the implementation of functions in this file should change.
//
// ============================================================================


const STORAGE_KEY = "reservations"


// Small artificial delay so the mock behaves more like a real API.
const MOCK_DELAY = 300


function delay(ms = MOCK_DELAY) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms)
  )
}


function loadReservations(): ReservationResponse[] {
  if (typeof window === "undefined") {
    return []
  }

  const data = localStorage.getItem(STORAGE_KEY)

  return data
    ? JSON.parse(data)
    : []
}


function saveReservations(
  reservations: ReservationResponse[]
) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(reservations)
  )
}


/**
 * Internal mock helper.
 *
 * Later this helper disappears completely because the database
 * inside Reservations Service becomes the source of truth.
 */
function findReservation(
  id: string
): ReservationResponse {
  const reservation =
    loadReservations().find(
      (reservation) => reservation.id === id
    )

  if (!reservation) {
    throw new Error("Reservation not found")
  }

  return reservation
}


/**
 * Internal mock helper used to persist changes in localStorage.
 *
 * IMPORTANT:
 * Components should normally use the public operations below
 * instead of manipulating reservation/payment statuses directly.
 */
function saveReservation(
  reservation: ReservationResponse
): ReservationResponse {
  const reservations = loadReservations()

  const index = reservations.findIndex(
    (item) => item.id === reservation.id
  )

  if (index === -1) {
    throw new Error("Reservation not found")
  }

  reservations[index] = reservation

  saveReservations(reservations)

  return reservation
}


/**
 * Builds order data exactly as the backend will later return it.
 *
 * MOCK:
 * Reads menu item information from mockMenuItems.
 *
 * LATER:
 * Remove this completely.
 * Reservations backend will get menu item name and price from
 * Restaurant Service and return OrderResponse itself.
 */
function buildOrders(
  request: ReservationRequest["orders"]
): OrderResponse[] {
  return request.map((order) => {
    const menuItem = mockMenuItems.find(
      (item) => item.id === order.menuItemId
    )

    if (!menuItem) {
      throw new Error(
        `Menu item ${order.menuItemId} not found`
      )
    }

    if (order.quantity <= 0) {
      throw new Error(
        "Order quantity must be greater than zero"
      )
    }

    return {
      menuItemId: menuItem.id,
      foodName: menuItem.food_name,
      price: menuItem.price,
      quantity: order.quantity,
      total:
        menuItem.price * order.quantity,
    }
  })
}


/**
 * GET /api/reservations
 *
 * CURRENT:
 * Reads reservations from localStorage.
 *
 * LATER:
 *
 * const response = await fetch(
 *   `${RESERVATIONS_API_URL}/api/reservations?...`
 * )
 *
 * return response.json()
 */
export async function getReservationsForUser(
  request?: ReservationQueryRequest
): Promise<ReservationListResponse> {
  await delay()

  let reservations = loadReservations()

  if (request?.type) {
    reservations = reservations.filter(
      (reservation) => {
        const dateTime = new Date(
          `${reservation.date}T${reservation.startTime}`
        )

        const isPast =
          dateTime.getTime() < Date.now()

        if (request.type === "upcoming") {
          return (
            !isPast &&
            reservation.status !== "Cancelled"
          )
        }

        return (
          isPast &&
          reservation.status !== "Cancelled"
        )
      }
    )
  }

  if (request?.status) {
    reservations = reservations.filter(
      (reservation) =>
        reservation.status === request.status
    )
  }

  const page = request?.page ?? 1
  const pageSize = request?.pageSize ?? 5

  const totalCount = reservations.length

  const totalPages = Math.ceil(
    totalCount / pageSize
  )

  const start = (page - 1) * pageSize

  const items = reservations.slice(
    start,
    start + pageSize
  )

  return {
    items,
    page,
    pageSize,
    totalCount,
    totalPages,
  }
}


/**
 * GET /api/reservations/{id}
 *
 * CURRENT:
 * Reads a reservation from localStorage.
 *
 * LATER:
 *
 * const response = await fetch(
 *   `${RESERVATIONS_API_URL}/api/reservations/${id}`
 * )
 *
 * if (!response.ok) {
 *   // Handle ProblemDetails returned by backend middleware.
 * }
 *
 * return response.json()
 */
export async function getReservationById(
  id: string
): Promise<ReservationResponse> {
  await delay()

  return findReservation(id)
}


/**
 * POST /api/reservations
 *
 * CURRENT:
 * Creates a mock reservation and stores it in localStorage.
 *
 * LATER:
 * Replace the whole function body with:
 *
 * const response = await fetch(
 *   `${RESERVATIONS_API_URL}/api/reservations`,
 *   {
 *     method: "POST",
 *     headers: {
 *       "Content-Type": "application/json",
 *     },
 *     body: JSON.stringify(request),
 *   }
 * )
 *
 * return response.json()
 *
 *
 * IMPORTANT BUSINESS RULE:
 *
 * Reservation with no food:
 *
 *   Confirmed / NotRequired
 *
 * Reservation with food:
 *
 *   Confirmed / NotStarted
 *
 * Payment is NOT started automatically.
 */
export async function createReservation(
  request: ReservationRequest
): Promise<ReservationResponse> {
  await delay()

  const restaurant =
    mockRestaurants.find(
      (item) =>
        item.id === request.restaurantId
    )

  if (!restaurant) {
    throw new Error("Restaurant not found")
  }

  const table =
    mockTables.find(
      (item) =>
        item.id === request.tableGroupId &&
        item.restaurantId === request.restaurantId
    )

  if (!table) {
    throw new Error("Table group not found")
  }

  if (request.guestNumber > table.seats) {
    throw new Error(
      "Selected table does not have enough seats"
    )
  }

  const orders =
    buildOrders(request.orders)

  const totalAmount =
    orders.reduce(
      (sum, order) =>
        sum + order.total,
      0
    )

  const reservation: ReservationResponse = {
    id: crypto.randomUUID(),

    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    restaurantCity: restaurant.city,

    tableGroupId: table.id,
    tableLocation: table.location,
    tableSeats: table.seats,

    date: request.date,
    startTime: request.startTime,
    guestNumber: request.guestNumber,

    servingTime:
      orders.length > 0
        ? request.servingTime
        : undefined,

    totalAmount,
    orders,

    // Reservation lifecycle is independent
    // from payment lifecycle.
    status: "Confirmed",

    paymentStatus:
      orders.length > 0
        ? "NotStarted"
        : "NotRequired",
  }

  const reservations =
    loadReservations()

  reservations.push(reservation)

  saveReservations(reservations)

  return reservation
}


/**
 * PUT /api/reservations/{id}
 *
 * TEMPORARY MOCK FUNCTION.
 *
 * It is kept because some existing frontend code may still use it.
 *
 * IMPORTANT:
 * Partial<ReservationResponse> should NOT be the final API contract.
 *
 * LATER:
 * Replace this parameter with the exact frontend equivalent of
 * the backend UpdateReservationRequest DTO.
 *
 * Example:
 *
 * updateReservation(
 *   id,
 *   {
 *     tableGroupId,
 *     date,
 *     startTime,
 *     guestNumber,
 *     servingTime,
 *   }
 * )
 *
 * The frontend should NEVER use this endpoint to manually change:
 *
 *   status
 *   paymentStatus
 *
 * Those states belong to backend business logic.
 */
export async function updateReservation(
  id: string,
  data: Partial<ReservationResponse>
): Promise<ReservationResponse> {
  await delay()

  const reservation =
    findReservation(id)

  const updated: ReservationResponse = {
    ...reservation,
    ...data,

    // Never allow ID to be changed.
    id: reservation.id,
  }

  return saveReservation(updated)
}


/**
 * PUT /api/reservations/{id}/orders
 *
 * CURRENT:
 * Rebuilds orders from mockMenuItems and stores the new state.
 *
 * LATER:
 * Replace the function body with the real HTTP call:
 *
 * const response = await fetch(
 *   `${RESERVATIONS_API_URL}/api/reservations/${id}/orders`,
 *   {
 *     method: "PUT",
 *     headers: {
 *       "Content-Type": "application/json",
 *     },
 *     body: JSON.stringify(request),
 *   }
 * )
 *
 * return response.json()
 *
 *
 * Backend rule mirrored here:
 *
 * Orders can be modified only before successful payment
 * or after a failed payment.
 */
export async function updateReservationOrders(
  id: string,
  request: UpdateReservationOrdersRequest
): Promise<ReservationResponse> {
  await delay()

  const reservation =
    findReservation(id)

  if (reservation.status !== "Confirmed") {
    throw new Error(
      "Cancelled or completed reservation cannot be modified"
    )
  }

  if (
    reservation.paymentStatus !== "NotRequired" &&
    reservation.paymentStatus !== "NotStarted" &&
    reservation.paymentStatus !== "Failed"
  ) {
    throw new Error(
      "Reservation cannot be modified in the current payment state"
    )
  }

  const orders =
    buildOrders(request.orders)

  const totalAmount =
    orders.reduce(
      (sum, order) =>
        sum + order.total,
      0
    )

  const updated: ReservationResponse = {
    ...reservation,

    orders,
    totalAmount,

    servingTime:
      orders.length > 0
        ? request.servingTime
        : undefined,

    paymentStatus:
      orders.length > 0
        ? "NotStarted"
        : "NotRequired",
  }

  return saveReservation(updated)
}


/**
 * POST /api/reservations/{id}/payment
 *
 * CURRENT:
 * Simulates Reservations Service calling Payment Service.
 *
 * It returns a fake clientSecret and changes local payment status
 * to Pending.
 *
 * LATER:
 * Replace the whole function body with:
 *
 * const response = await fetch(
 *   `${RESERVATIONS_API_URL}/api/reservations/${id}/payment`,
 *   {
 *     method: "POST",
 *   }
 * )
 *
 * return response.json()
 *
 *
 * IMPORTANT:
 * Frontend still calls this same function later.
 *
 * What changes is only its implementation.
 */
export async function startReservationPayment(
  id: string
): Promise<StartPaymentResponse> {
  await delay(800)

  const reservation =
    findReservation(id)


  if (
    reservation.status !==
    "Confirmed"
  ) {
    throw new Error(
      "Payment cannot be started for this reservation"
    )
  }


  if (
    reservation.orders.length === 0 ||
    reservation.totalAmount <= 0
  ) {
    throw new Error(
      "Reservation has no food order to pay"
    )
  }


  if (
    reservation.paymentStatus !==
      "NotStarted" &&
    reservation.paymentStatus !==
      "Failed"
  ) {
    throw new Error(
      "Payment cannot be started in the current payment state"
    )
  }


  /*
   * ========================================================
   * TEMPORARY MOCK CLIENT SECRET
   * ========================================================
   *
   * Replace this manually whenever a new Stripe
   * test PaymentIntent is created.
   *
   * LATER:
   *
   * DELETE this variable completely.
   *
   * The real Reservations API will return
   * clientSecret from:
   *
   * POST /api/reservations/{id}/payment
   */
  const testClientSecret =
    "pi_3U5Wb7EQ4S80Rhls0lI3ASHz_secret_veMFAJozxfBD2MSfdLhp74Xwi"


  if (!testClientSecret) {
    throw new Error(
      "Stripe test client secret is not configured"
    )
  }


  const updated: ReservationResponse = {
    ...reservation,

    paymentStatus:
      "Pending",
  }


  saveReservation(
    updated
  )


  return {
    clientSecret:
      testClientSecret,

    paymentStatus:
      "Pending",
  }
}


/**
 * DELETE /api/reservations/{id}
 *
 * IMPORTANT:
 * DELETE does NOT physically delete the reservation.
 *
 * It means:
 *
 *   Cancel reservation.
 *
 *
 * CURRENT:
 * Simulates backend cancellation logic.
 *
 * If payment has already succeeded:
 *
 *   Confirmed / Succeeded
 *
 * becomes:
 *
 *   Cancelled / RefundPending
 *
 *
 * LATER:
 * Replace the function body with:
 *
 * const response = await fetch(
 *   `${RESERVATIONS_API_URL}/api/reservations/${id}`,
 *   {
 *     method: "DELETE",
 *   }
 * )
 *
 * if (!response.ok) {
 *   // Handle ProblemDetails
 * }
 *
 * The real backend returns 204 No Content.
 */
export async function cancelReservation(
  id: string
): Promise<void> {
  await delay()

  const reservation =
    findReservation(id)

  if (reservation.status !== "Confirmed") {
    throw new Error(
      "Reservation cannot be cancelled"
    )
  }

  if (
    reservation.paymentStatus === "Pending" ||
    reservation.paymentStatus === "RefundPending"
  ) {
    throw new Error(
      "Reservation cannot be cancelled while payment processing is in progress"
    )
  }

  const updated: ReservationResponse = {
    ...reservation,

    status: "Cancelled",

    paymentStatus:
      reservation.paymentStatus === "Succeeded"
        ? "RefundPending"
        : reservation.paymentStatus,
  }

  saveReservation(updated)
}
