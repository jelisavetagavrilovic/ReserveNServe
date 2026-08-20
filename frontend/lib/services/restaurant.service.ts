export {
  getRestaurants,
  getRestaurantById,
  getTablesByRestaurant,
  getTableById,
  getMenuByRestaurant,
  getRestaurantFilters,
  getAvailableSlots,
} from "../api/restaurant.api"

export type {
  Restaurant,
  RestaurantQueryRequest,
  RestaurantListResponse,
  RestaurantDetailsResponse,
  RestaurantFiltersResponse,
  Table,
  TableListResponse,
  TableDetailsResponse,
  MenuItem,
  MenuListResponse,
  AvailableSlotsResponse,
} from "../types/restaurant.types"

