import type { PaginatedResponse } from "./pagination.types"

export type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "PendingPayment"
  | "Cancelled"
  | "Completed"
  | "Failed"

export type EmailStatus =
  | "Pending"
  | "Sent"
  | "Failed"

export type ReservationType =
  | "upcoming"
  | "past"

export type ReservationRequest = {
  restaurantId: number
  tableGroupId: number
  date: string
  startTime: string
  guestNumber: number
  orders: OrderRequest[]
  servingTime?: string
}

export type ReservationQueryRequest = {
  page?: number
  pageSize?: number
  type?: ReservationType
  status?: ReservationStatus
}

export type OrderRequest = {
  menuItemId: number
  quantity: number
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
  emailStatus: EmailStatus
}

export type ReservationListResponse =
  PaginatedResponse<ReservationResponse>


export type OrderResponse = {
  menuItemId: number
  foodName: string
  price: number
  quantity: number
  total: number
}
