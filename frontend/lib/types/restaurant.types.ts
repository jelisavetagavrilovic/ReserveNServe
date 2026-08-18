import type { PaginatedResponse } from "./pagination.types"

// restaurants
export type Restaurant = {
  id: number
  name: string
  description: string
  city: string
  address: string
  phone_number: string
  opening_time: string
  closing_time: string
  rating: number
  price_range: string
  cuisine_type: string
  reservation_duration: string
  image: string
}

export type RestaurantQueryRequest = {
  search?: string
  cuisine_type?: string
  price?: string
  sortBy?: "rating" | "name"

  page?: number
  pageSize?: number
}

export type RestaurantListResponse =
  PaginatedResponse<Restaurant>

export type RestaurantDetailsResponse = {
  restaurant: Restaurant
}

export type RestaurantFiltersResponse = {
  cuisines: string[]
  rangePrices: string[]
}

// tables
export type Table = {
  id: number
  restaurantId: number
  seats: number
  location: string
  available_number: number
}

export type TableListResponse = {
  tables: Table[]
}

export type TableDetailsResponse = {
  table: Table
}

// menu
export type MenuCategory =
  | "appetizer"
  | "main"
  | "dessert"
  | "drinks"

export type MenuItem = {
  id: number
  restaurant_id: number
  food_name: string
  description: string
  price: number
  image: string
  category: MenuCategory
}

export type MenuListResponse = {
  items: MenuItem[]
}

// available slots
export type AvailableSlotsResponse = {
  slots: string[]
}