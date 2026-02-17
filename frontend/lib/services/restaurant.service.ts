import type { Restaurant, Table, MenuItem } from "../types"
import { mockRestaurants, mockTables, mockMenuItems } from "../mock-data"

// todo: replace with fetch to the right API when backend exists

type RestaurantQuery = {
  search?: string
  cuisine?: string
  price?: string
  sortBy?: "rating" | "name"
}

export async function getRestaurants(query?: RestaurantQuery): Promise<Restaurant[]> {
  let results = [...mockRestaurants]

  if (query?.search) {
    const q = query.search.toLowerCase()
    results = results.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cusine_type.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    )
  }

  if (query?.cuisine && query.cuisine !== "all") {
    results = results.filter(r => r.cusine_type === query.cuisine)
  }

  if (query?.price && query.price !== "all") {
    results = results.filter(r => r.price_range === query.price)
  }

  if (query?.sortBy === "rating") results.sort((a, b) => b.rating - a.rating)
  if (query?.sortBy === "name") results.sort((a, b) => a.name.localeCompare(b.name))


  // return fetch(`/api/restaurants?...`).then(res => res.json()) + authentication
  return new Promise(resolve => setTimeout(() => resolve(results), 300))
}

export async function getRestaurantById(id: number): Promise<Restaurant | undefined> {
  return new Promise(resolve => setTimeout(() => resolve(mockRestaurants.find(r => r.id === id)), 200))
}

export async function getTablesByRestaurant(restaurantId: number): Promise<Table[]> {
  return new Promise(resolve => setTimeout(() => resolve(mockTables.filter(t => t.restaurantId === restaurantId)), 200))
}

export async function getTableById(id: number): Promise<Table | undefined> {
  return new Promise(resolve => setTimeout(() => resolve(mockTables.find(T => T.id === id)), 200))
}

export async function getMenuByRestaurant(restaurantId: number): Promise<MenuItem[]> {
  return new Promise(resolve => setTimeout(() => resolve(mockMenuItems.filter(m => m.restaurant_id === restaurantId)), 200))
}

export async function getCuisines(): Promise<string[]> {
  const restaurants = await getRestaurants()
  const cuisines = Array.from(new Set(restaurants.map(r => r.cusine_type)))
  return cuisines
}

export async function getRangePrices(): Promise<string[]> {
  const restaurants = await getRestaurants()
  const rangePrices = Array.from(new Set(restaurants.map(r => r.price_range)))
  return rangePrices
}