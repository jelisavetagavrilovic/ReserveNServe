"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"

import Loading from "@/components/loading"
import { RestaurantCard } from "@/components/restaurant-card"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react"

import type { Restaurant } from "@/lib/types/restaurant.types"

import {
  getRestaurantFilters,
  getRestaurants,
} from "@/lib/services/restaurant.service"

import { useAppStore } from "@/lib/store"

type RestaurantSort = "rating" | "name"

interface RestaurantUrlState {
  search: string
  cuisineType: string
  price: string
  sortBy: RestaurantSort
  page: number
}

function readUrlState(searchParams: {
  get: (name: string) => string | null
}): RestaurantUrlState {
  const requestedPage = Number(searchParams.get("page"))
  const requestedSort = searchParams.get("sortBy")

  return {
    search: searchParams.get("search") ?? "",
    cuisineType: searchParams.get("cuisineType") ?? "all",
    price: searchParams.get("price") ?? "all",
    sortBy: requestedSort === "name" ? "name" : "rating",
    page:
      Number.isInteger(requestedPage) && requestedPage > 0
        ? requestedPage
        : 1,
  }
}

function RestaurantsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  /*
   * These are the filters currently applied to the results.
   * They always come from the URL.
   */
  const appliedFilters = useMemo(
    () => readUrlState(searchParams),
    [searchParams]
  )

  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [cuisines, setCuisines] = useState<string[]>([])
  const [rangePrices, setRangePrices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  const [totalPages, setTotalPages] = useState(1)

  /*
   * These values represent what the user is currently typing/selecting.
   * They become applied filters after clicking Apply Filters.
   */
  const [searchQuery, setSearchQuery] = useState(
    appliedFilters.search
  )
  const [cuisineFilter, setCuisineFilter] = useState(
    appliedFilters.cuisineType
  )
  const [priceFilter, setPriceFilter] = useState(
    appliedFilters.price
  )
  const [sortBy, setSortBy] = useState<RestaurantSort>(
    appliedFilters.sortBy
  )

  const {
    setSelectedTable,
    clearCart,
    setCurrentReservationRequest,
    setCurrentReservationResponse,
  } = useAppStore()

  /**
   * Creates a clean URL.
   * Default values are omitted from the query string.
   */
  const navigateToFilters = useCallback(
    (filters: RestaurantUrlState) => {
      const params = new URLSearchParams()
      const normalizedSearch = filters.search.trim()

      if (normalizedSearch) {
        params.set("search", normalizedSearch)
      }

      if (filters.cuisineType !== "all") {
        params.set("cuisineType", filters.cuisineType)
      }

      if (filters.price !== "all") {
        params.set("price", filters.price)
      }

      if (filters.sortBy !== "rating") {
        params.set("sortBy", filters.sortBy)
      }

      if (filters.page > 1) {
        params.set("page", String(filters.page))
      }

      const queryString = params.toString()
      const url = queryString
        ? `${pathname}?${queryString}`
        : pathname

      router.push(url)
    },
    [pathname, router]
  )

  /*
   * Load filter options and reset an unfinished reservation
   * when the restaurant listing is opened.
   */
  useEffect(() => {
    setSelectedTable(null)
    clearCart()
    setCurrentReservationRequest(null)
    setCurrentReservationResponse(null)

    const loadFilters = async () => {
      try {
        const filters = await getRestaurantFilters()

        setCuisines(filters.cuisines)
        setRangePrices(filters.rangePrices)
      } catch (error) {
        console.error("Failed to load restaurant filters:", error)
      }
    }

    void loadFilters()
  }, [
    clearCart,
    setCurrentReservationRequest,
    setCurrentReservationResponse,
    setSelectedTable,
  ])

  /*
   * Synchronize the form with the URL when the user uses
   * browser Back or Forward.
   */
  useEffect(() => {
    setSearchQuery(appliedFilters.search)
    setCuisineFilter(appliedFilters.cuisineType)
    setPriceFilter(appliedFilters.price)
    setSortBy(appliedFilters.sortBy)
  }, [
    appliedFilters.search,
    appliedFilters.cuisineType,
    appliedFilters.price,
    appliedFilters.sortBy,
  ])

  /*
   * Fetch restaurants whenever an applied URL parameter changes.
   */
  useEffect(() => {
    let isActive = true

    const loadRestaurants = async () => {
      setLoading(true)
      setHasSearched(true)

      try {
        const response = await getRestaurants({
          search: appliedFilters.search,
          cuisineType: appliedFilters.cuisineType,
          price: appliedFilters.price,
          sortBy: appliedFilters.sortBy,
          page: appliedFilters.page,
          pageSize: 12,
        })

        if (!isActive) return

        setRestaurants(response.items)
        setTotalPages(Math.max(response.totalPages, 1))
      } catch (error) {
        if (!isActive) return

        console.error("Failed to load restaurants:", error)
        setRestaurants([])
        setTotalPages(1)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void loadRestaurants()

    return () => {
      isActive = false
    }
  }, [
    appliedFilters.search,
    appliedFilters.cuisineType,
    appliedFilters.price,
    appliedFilters.sortBy,
    appliedFilters.page,
  ])

  const handleApplyFilters = () => {
    navigateToFilters({
      search: searchQuery,
      cuisineType: cuisineFilter,
      price: priceFilter,
      sortBy,
      page: 1,
    })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setCuisineFilter("all")
    setPriceFilter("all")
    setSortBy("rating")

    navigateToFilters({
      search: "",
      cuisineType: "all",
      price: "all",
      sortBy: "rating",
      page: 1,
    })
  }

  const handlePreviousPage = () => {
    if (appliedFilters.page <= 1) return

    navigateToFilters({
      ...appliedFilters,
      page: appliedFilters.page - 1,
    })
  }

  const handleNextPage = () => {
    if (appliedFilters.page >= totalPages) return

    navigateToFilters({
      ...appliedFilters,
      page: appliedFilters.page + 1,
    })
  }

  return (
    <PageContainer>
      <PageHeader
        title="Restaurants"
        description="Discover and book tables at the best restaurants"
      />

      {/* Filters */}
      <div className="mb-6 rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleApplyFilters()
                }
              }}
              className="h-10 rounded-xl pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Select
              value={cuisineFilter}
              onValueChange={setCuisineFilter}
            >
              <SelectTrigger className="w-[150px] rounded-xl">
                <SelectValue placeholder="Cuisine" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Cuisines
                </SelectItem>

                {cuisines.map((cuisine) => (
                  <SelectItem
                    key={cuisine}
                    value={cuisine}
                  >
                    {cuisine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priceFilter}
              onValueChange={setPriceFilter}
            >
              <SelectTrigger className="w-[130px] rounded-xl">
                <SelectValue placeholder="Price" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">
                  All Prices
                </SelectItem>

                {rangePrices.map((price) => (
                  <SelectItem
                    key={price}
                    value={price}
                  >
                    {price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as RestaurantSort)
              }
            >
              <SelectTrigger className="w-[145px] rounded-xl">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="rating">
                  Top Rated
                </SelectItem>

                <SelectItem value="name">
                  Name A-Z
                </SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              className="rounded-xl"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {loading && <Loading />}

      {!loading && restaurants.length > 0 && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={appliedFilters.page <= 1}
                onClick={handlePreviousPage}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-muted-foreground">
                Page{" "}
                <span className="font-medium text-foreground">
                  {appliedFilters.page}
                </span>{" "}
                of {totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={
                  appliedFilters.page >= totalPages
                }
                onClick={handleNextPage}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {!loading &&
        hasSearched &&
        restaurants.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>

            <h3 className="text-lg font-semibold">
              No restaurants found
            </h3>

            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filters.
            </p>

            <Button
              type="button"
              variant="outline"
              className="mt-6 rounded-xl"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        )}
    </PageContainer>
  )
}

export default function RestaurantsPage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <Loading />
        </PageContainer>
      }
    >
      <RestaurantsPageContent />
    </Suspense>
  )
}