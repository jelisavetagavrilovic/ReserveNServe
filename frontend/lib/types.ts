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
  image?: string
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
  image?: string // može biti URL ili Base64 string za sada
  category: string
}

export interface CartItem extends MenuItem {
  quantity: number
  specialInstructions?: string
}

export interface PreOrder {
  menuItemId: string
  quantity: number
}


