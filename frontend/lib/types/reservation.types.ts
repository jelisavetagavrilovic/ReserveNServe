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

export type ReservationRequest = {
  restaurantId: number
  tableGroupId: number
  date: string
  startTime: string
  guestNumber: number
  orders: OrderRequest[]
  servingTime?: string
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

export type OrderResponse = {
  menuItemId: number
  foodName: string
  price: number
  quantity: number
  total: number
}

export type PaymentRequest = {
  reservationId: string
  amount: number
  card: {
    holderName: string
    cardNumber: string
    expiry: string
    cvc: string
  }
}