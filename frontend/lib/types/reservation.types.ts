import type { PaginatedResponse } from "./pagination.types"

export type ReservationStatus =
  | "Confirmed"
  | "Cancelled"
  | "Completed"

export type ReservationPaymentStatus =
  | "NotRequired"
  | "NotStarted"
  | "Pending"
  | "Succeeded"
  | "Failed"
  | "RefundPending"
  | "Refunded"
  | "RefundFailed"

export type ReservationType =
  | "upcoming"
  | "past"

export type OrderRequest = {
  menuItemId: number
  quantity: number
}

export type ReservationRequest = {
  restaurantId: number
  tableGroupId: number
  date: string
  startTime: string
  guestNumber: number
  orders: OrderRequest[]
  servingTime?: string
}

export type UpdateReservationOrdersRequest = {
  orders: OrderRequest[]
  servingTime?: string
}

export type UpdateReservationRequest = {
  tableGroupId: number
  date: string
  startTime: string
  guestNumber: number
  servingTime?: string | null
}

export type ReservationQueryRequest = {
  page?: number
  pageSize?: number
  type?: ReservationType
  status?: ReservationStatus
}

export type OrderResponse = {
  menuItemId: number
  foodName: string
  price: number
  quantity: number
  total: number
}

export type ReservationResponse = {
  id: string

  restaurantId: number
  restaurantName: string
  restaurantAddress: string
  restaurantCity: string

  tableGroupId: number
  tableLocation: string
  tableSeats: number

  date: string
  startTime: string
  guestNumber: number
  servingTime?: string

  totalAmount: number
  orders: OrderResponse[]

  status: ReservationStatus
  paymentStatus: ReservationPaymentStatus
}

export type ReservationListResponse =
  PaginatedResponse<ReservationResponse>

export type StartPaymentResponse = {
  clientSecret: string
  paymentStatus: ReservationPaymentStatus
}