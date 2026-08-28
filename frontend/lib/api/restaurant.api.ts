import { apiRequest } from "@/lib/api/http-client"

import {
  mockAvailableSlots,
  mockTables,
} from "../mock-data"

import type {
  AvailableSlotsResponse,
  MenuItem,
  MenuListResponse,
  Restaurant,
  RestaurantDetailsResponse,
  RestaurantFiltersResponse,
  RestaurantListResponse,
  RestaurantQueryRequest,
  TableDetailsResponse,
  TableListResponse,
} from "../types/restaurant.types"


const RESTAURANTS_API_URL =
  process.env.NEXT_PUBLIC_RESTAURANTS_API_URL


if (!RESTAURANTS_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_RESTAURANTS_API_URL environment variable is not configured."
  )
}


function restaurantsUrl(path = "") {
  return `${RESTAURANTS_API_URL}/api/Restaurants${path}`
}


export async function getRestaurants(
  query?: RestaurantQueryRequest
): Promise<RestaurantListResponse> {
  const params = new URLSearchParams()

  if (query?.search) {
    params.set("search", query.search)
  }

  if (
    query?.cuisineType &&
    query.cuisineType !== "all"
  ) {
    params.set(
      "cuisineType",
      query.cuisineType
    )
  }

  if (
    query?.price &&
    query.price !== "all"
  ) {
    params.set("price", query.price)
  }

  if (query?.sortBy) {
    params.set("sortBy", query.sortBy)
  }

  if (query?.page !== undefined) {
    params.set(
      "page",
      String(query.page)
    )
  }

  if (query?.pageSize !== undefined) {
    params.set(
      "pageSize",
      String(query.pageSize)
    )
  }

  const queryString =
    params.toString()

  return apiRequest<RestaurantListResponse>(
    `${restaurantsUrl("/GetRestaurants")}${
      queryString
        ? `?${queryString}`
        : ""
    }`
  )
}


export async function getRestaurantById(
  id: number
): Promise<RestaurantDetailsResponse> {
  const restaurant =
    await apiRequest<Restaurant>(
      restaurantsUrl(
        `/GetRestaurants/${id}`
      )
    )

  return {
    restaurant,
  }
}


export async function getMenuByRestaurant(
  restaurantId: number
): Promise<MenuListResponse> {
  const items =
    await apiRequest<MenuItem[]>(
      restaurantsUrl(
        `/GetMenuForRestaurant/${restaurantId}`
      )
    )

  return {
    items,
  }
}


export async function getRestaurantFilters():
  Promise<RestaurantFiltersResponse> {
  return apiRequest<RestaurantFiltersResponse>(
    restaurantsUrl(
      "/GetRestaurantsFilters"
    )
  )
}


/*
 * Temporary mock availability.
 *
 * These functions will be moved to the
 * Reservations API integration next.
 */
export async function getTablesByRestaurant(
  restaurantId: number
): Promise<TableListResponse> {
  const tables =
    mockTables.filter(
      (table) =>
        table.restaurantId === restaurantId
    )

  return {
    tables,
  }
}


export async function getTableById(
  id: number
): Promise<TableDetailsResponse | null> {
  const table =
    mockTables.find(
      (table) => table.id === id
    )

  return table
    ? { table }
    : null
}


export type AvailableSlotsRequest = {
  restaurantId: number
  date: string
}


export async function getAvailableSlots(
  request: AvailableSlotsRequest
): Promise<AvailableSlotsResponse> {
  return {
    slots:
      mockAvailableSlots[
        request.restaurantId
      ] || [],
  }
}