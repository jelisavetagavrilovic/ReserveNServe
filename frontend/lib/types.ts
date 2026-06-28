
export interface User {
  id: number
  name: string
  surname: string
  email: string
  phone?: string
}
export interface Restaurant {
  id: number
  name: string
  description: string
  city: string
  address: string
  phone_number: string
  opening_time_workday: string // "HH:MM" format
  closing_time_workday: string
  opening_time_weekend: string
  closing_time_weekend: string
  rating: number
  price_range: string
  cusine_type: string
  reservation_duration: string // "HH:MM:SS" format
  image: string
}

export interface Table {
  id: number
  restaurantId: number
  location: string
  seats: number
  available_number: number
}

export interface MenuItem {
  id: number
  restaurant_id: number
  food_name: string
  description: string
  price: number
  image: string 
  category: string
}

export interface CartItem extends MenuItem {
  quantity: number
}

export interface PreOrderItem {
  menuItemId: number      
  food_name: string       
  price: number           
  quantity: number 
}

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "failed"
  | "draft"

export interface Reservation {
  id?: string
  userId: string
  restaurantId: number
  tableId: number
  date: string       // "2026-01-28"
  time: string       // "19:30"
  partySize: number
  preOrders: PreOrderItem[]
  servingTime?: string | null
  totalAmount: number
  status: ReservationStatus
}
