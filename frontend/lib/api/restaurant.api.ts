import {
  mockRestaurants,
  mockTables,
  mockMenuItems,
  mockAvailableSlots
} from "../mock-data"

import type {
  RestaurantQueryRequest,
  RestaurantListResponse,
  RestaurantDetailsResponse,
  RestaurantFiltersResponse,
  TableListResponse,
  TableDetailsResponse,
  MenuListResponse,
  AvailableSlotsResponse,
} from "../types/restaurant.types"


export async function getRestaurants(
  query?: RestaurantQueryRequest
): Promise<RestaurantListResponse> {
  let results = [...mockRestaurants]

  if (query?.search) {
    const q = query.search.toLowerCase()

    results = results.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(q) ||
        restaurant.cuisine_type.toLowerCase().includes(q) ||
        restaurant.description.toLowerCase().includes(q)
    )
  }

  if (query?.cuisine_type && query.cuisine_type !== "all") {
    results = results.filter(
      (restaurant) => restaurant.cuisine_type === query.cuisine_type
    )
  }

  if (query?.price && query.price !== "all") {
    results = results.filter(
      (restaurant) => restaurant.price_range === query.price
    )
  }

  if (query?.sortBy === "rating") {
    results.sort((a, b) => b.rating - a.rating)
  }

  if (query?.sortBy === "name") {
    results.sort((a, b) => a.name.localeCompare(b.name))
  }

  const page = query?.page ?? 1
  const pageSize = query?.pageSize ?? 6

  const totalCount = results.length
  const totalPages = Math.ceil(
    totalCount / pageSize
  )

  const start = (page - 1) * pageSize
  const paginatedItems = results.slice(
    start,
    start + pageSize
  )

  // return new Promise((resolve) =>
  //   setTimeout(() => resolve({ restaurants: results }), 300)
  // )
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          items: paginatedItems,
          page,
          pageSize,
          totalCount,
          totalPages,
        }),
      300
    )
  )
}

export async function getRestaurantById(
  id: number
): Promise<RestaurantDetailsResponse | null> {
  const restaurant = mockRestaurants.find((r) => r.id === id)

  return new Promise((resolve) =>
    setTimeout(
      () => resolve(restaurant ? { restaurant } : null),
      200
    )
  )
}

export async function getTablesByRestaurant(
  restaurantId: number
): Promise<TableListResponse> {
  const tables = mockTables.filter(
    (table) => table.restaurantId === restaurantId
  )

  return new Promise((resolve) =>
    setTimeout(() => resolve({ tables }), 200)
  )
}

export async function getTableById(
  id: number
): Promise<TableDetailsResponse | null> {
  const table = mockTables.find((table) => table.id === id)

  return new Promise((resolve) =>
    setTimeout(() => resolve(table ? { table } : null), 200)
  )
}

export async function getMenuByRestaurant(
  restaurantId: number
): Promise<MenuListResponse> {
  const items = mockMenuItems.filter(
    (item) => item.restaurant_id === restaurantId
  )

  return new Promise((resolve) =>
    setTimeout(() => resolve({ items }), 200)
  )
}

export async function getRestaurantFilters(): Promise<RestaurantFiltersResponse> {
  const cuisines = Array.from(
    new Set(mockRestaurants.map((restaurant) => restaurant.cuisine_type))
  )

  const rangePrices = Array.from(
    new Set(mockRestaurants.map((restaurant) => restaurant.price_range))
  )

  return {
    cuisines,
    rangePrices,
  }
}


export type AvailableSlotsRequest = {
  restaurantId: number
  date: string
}

export async function getAvailableSlots(
  request: AvailableSlotsRequest
): Promise<AvailableSlotsResponse> {
  const slots = mockAvailableSlots[request.restaurantId] || []

  return new Promise((resolve) =>
    setTimeout(() => resolve({ slots }), 200)
  )
}