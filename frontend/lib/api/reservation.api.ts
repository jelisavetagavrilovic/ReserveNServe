import type {
  ReservationRequest,
  ReservationResponse,
  ReservationQueryRequest,
  ReservationListResponse,
  UpdateReservationOrdersRequest,
  UpdateReservationRequest,
  StartPaymentResponse,
} from "../types/reservation.types"

import { apiRequest } from "./http-client"


const RESERVATIONS_API_URL =
  process.env.NEXT_PUBLIC_RESERVATIONS_API_URL

if (!RESERVATIONS_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_RESERVATIONS_API_URL environment variable is not configured."
  )
}


function reservationsUrl(path = "") {
  return `${RESERVATIONS_API_URL}/api/reservations${path}`
}


export async function getReservationsForUser(
  request?: ReservationQueryRequest
): Promise<ReservationListResponse> {
  const params = new URLSearchParams()

  if (request?.type) {
    params.set("type", request.type)
  }

  if (request?.status) {
    params.set("status", request.status)
  }

  if (request?.page !== undefined) {
    params.set("page", String(request.page))
  }

  if (request?.pageSize !== undefined) {
    params.set("pageSize", String(request.pageSize))
  }

  const query = params.toString()

  return apiRequest<ReservationListResponse>(
    `${reservationsUrl()}${query ? `?${query}` : ""}`
  )
}


export async function getReservationById(
  id: string
): Promise<ReservationResponse> {
  return apiRequest<ReservationResponse>(
    reservationsUrl(`/${id}`)
  )
}


export async function createReservation(
  request: ReservationRequest
): Promise<ReservationResponse> {
  return apiRequest<ReservationResponse>(
    reservationsUrl(),
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  )
}


export async function updateReservation(
  id: string,
  request: UpdateReservationRequest
): Promise<ReservationResponse> {
  return apiRequest<ReservationResponse>(
    reservationsUrl(`/${id}`),
    {
      method: "PUT",
      body: JSON.stringify(request),
    }
  )
}


export async function updateReservationOrders(
  id: string,
  request: UpdateReservationOrdersRequest
): Promise<ReservationResponse> {
  return apiRequest<ReservationResponse>(
    reservationsUrl(`/${id}/orders`),
    {
      method: "PUT",
      body: JSON.stringify(request),
    }
  )
}


export async function startReservationPayment(
  id: string
): Promise<StartPaymentResponse> {
  return apiRequest<StartPaymentResponse>(
    reservationsUrl(`/${id}/payment`),
    {
      method: "POST",
    }
  )
}


export async function cancelReservation(
  id: string
): Promise<void> {
  await apiRequest<void>(
    reservationsUrl(`/${id}`),
    {
      method: "DELETE",
    }
  )
}