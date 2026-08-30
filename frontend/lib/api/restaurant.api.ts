import { apiRequest } from "@/lib/api/http-client"


import type {
  AvailableSlotsResponse,
  AvailableSlotsRequest,
  AvailableTablesRequest,
  MenuItem,
  MenuListResponse,
  Restaurant,
  RestaurantDetailsResponse,
  RestaurantFiltersResponse,
  RestaurantListResponse,
  RestaurantQueryRequest,
  TableDetailsResponse,
  TableListResponse,
  Table,
} from "../types/restaurant.types"


const RESTAURANTS_API_URL = process.env.NEXT_PUBLIC_RESTAURANTS_API_URL
if (!RESTAURANTS_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_RESTAURANTS_API_URL environment variable is not configured."
  )
}

const RESERVATIONS_API_URL = process.env.NEXT_PUBLIC_RESERVATIONS_API_URL
if (!RESERVATIONS_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_RESERVATIONS_API_URL environment variable is not configured."
  )
}


function restaurantsUrl(path = "") {
  return `${RESTAURANTS_API_URL}/api/Restaurants${path}`
}

function reservationsUrl(path = "") {
  return `${RESERVATIONS_API_URL}/api/reservations${path}`
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

  return {
    restaurant,
  }
}


type AvailableTableApiResponse = {
  tableGroupId: number
  location: string
  capacity: number
  availableTables: number
}

export async function getTablesByRestaurant(
  request: AvailableTablesRequest
): Promise<TableListResponse> {
  const params =
    new URLSearchParams({
      restaurantId:
        String(request.restaurantId),

      date:
        request.date,

      time:
        request.time,

      guestNumber:
        String(request.guestNumber),
    })


  const response =
    await apiRequest<
      AvailableTableApiResponse[]
    >(
      `${reservationsUrl(
        "/availability/tables"
      )}?${params.toString()}`
    )


  return {
    tables:
      response.map(
        (table) => ({
          id: table.tableGroupId,
          restaurantId:
            request.restaurantId,

          seats:
            table.capacity,

          location:
            table.location,

          availableNumber:
            table.availableTables,
        })
      ),
  }
}


export async function getTableById(
  id: number
): Promise<TableDetailsResponse> {
  const table =
    await apiRequest<Table>(
      restaurantsUrl(
        `/GetTable/${id}`
      )
    )

  return {
    table,
  }
}


type AvailableSlotApiResponse = {
  time: string
}


export async function getAvailableSlots(
  request: AvailableSlotsRequest
): Promise<AvailableSlotsResponse> {
  const params =
    new URLSearchParams({
      restaurantId:
        String(request.restaurantId),

      date:
        request.date,

      guestNumber:
        String(request.guestNumber),
    })


  const response =
    await apiRequest<
      AvailableSlotApiResponse[]
    >(
      `${reservationsUrl(
        "/availability/slots"
      )}?${params.toString()}`
    )


  return {
    slots:
      response.map(
        (slot) => slot.time
      ),
  }
}