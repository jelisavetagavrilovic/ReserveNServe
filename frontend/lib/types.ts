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
