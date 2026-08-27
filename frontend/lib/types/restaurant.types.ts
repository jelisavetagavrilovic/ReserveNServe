import type { PaginatedResponse } from "./pagination.types"


export type Restaurant = {
  id: number
  name: string
  description: string | null
  city: string
  address: string
  phoneNumber: string
  openingTime: string
  closingTime: string
  rating: number
  price: string
  cuisineType: string
  reservationDuration: number
  image: string | null
}

export type RestaurantQueryRequest = {
  search?: string
  cuisineType?: string
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

// Table represents a table in a restaurant
export type Table = {
  id: number
  restaurantId: number
  seats: number
  location: string
  availableNumber: number
}

export type TableListResponse = {
  tables: Table[]
}

export type TableDetailsResponse = {
  table: Table
}

// MenuCategory represents the category of a menu item
export type MenuCategory =
  | "appetizer"
  | "main"
  | "dessert"
  | "drinks"

export type MenuItem = {
  id: number
  restaurantId: number
  foodName: string
  description: string
  price: number
  image: string
  category: MenuCategory
}

export type MenuListResponse = {
  items: MenuItem[]
}

// AvailableSlotsResponse represents the response for available reservation slots for a restaurant
export type AvailableSlotsResponse = {
  slots: string[]
}