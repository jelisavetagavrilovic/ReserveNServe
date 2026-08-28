"use client"

import { useCallback, useEffect, useState } from "react"

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
  SlidersHorizontal,
} from "lucide-react"

import type {
  Restaurant,
  RestaurantQueryRequest,
} from "@/lib/types/restaurant.types"

import {
  getRestaurantFilters,
  getRestaurants,
} from "@/lib/services/restaurant.service"

import { useAppStore } from "@/lib/store"

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [cuisines, setCuisines] = useState<string[]>([])
  const [rangePrices, setRangePrices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [cuisineFilter, setCuisineFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"rating" | "name">("rating")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const {
    setSelectedTable,
    clearCart,
    setCurrentReservationRequest,
    setCurrentReservationResponse,
  } = useAppStore()

  const handleSearch = useCallback(
    async (params?: RestaurantQueryRequest) => {
      setLoading(true)
      setHasSearched(true)

      try {
        const response = await getRestaurants({
          search: params?.search ?? searchQuery,
          cuisineType: params?.cuisineType ?? cuisineFilter,
          price: params?.price ?? priceFilter,
          sortBy: params?.sortBy ?? sortBy,
          page: params?.page ?? page,
          pageSize: 4,
        })

        setRestaurants(response.items)
        setTotalPages(response.totalPages)
      } finally {
        setLoading(false)
      }
    },
    [
      searchQuery,
      cuisineFilter,
      priceFilter,
      sortBy,
      page,
    ]
  )

  useEffect(() => {
    const init = async () => {
      setSelectedTable(null)
      clearCart()
      setCurrentReservationRequest(null)
      setCurrentReservationResponse(null)

      setLoading(true)

      const filters = await getRestaurantFilters()

      setCuisines(filters.cuisines)
      setRangePrices(filters.rangePrices)

      await handleSearch({
        sortBy: "rating",
        page: 1,
      })
    }

    void init()
  }, [])

  useEffect(() => {
    if (!hasSearched) return

    void handleSearch()
  }, [page])

  const handleApplyFilters = () => {
    if (page !== 1) {
      setPage(1)
      return
    }

    void handleSearch({
      page: 1,
    })
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setCuisineFilter("all")
    setPriceFilter("all")

    if (page !== 1) {
      setPage(1)

      void handleSearch({
        search: "",
        cuisineType: "all",
        price: "all",
        sortBy,
        page: 1,
      })

      return
    }

    void handleSearch({
      search: "",
      cuisineType: "all",
      price: "all",
      sortBy,
      page: 1,
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

          {/* Filters */}
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
                setSortBy(
                  value as "rating" | "name"
                )
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

      {/* Loading */}
      {loading && <Loading />}

      {/* Results */}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={page === 1}
                onClick={() =>
                  setPage(
                    (previous) =>
                      previous - 1
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sm text-muted-foreground">
                Page{" "}
                <span className="font-medium text-foreground">
                  {page}
                </span>{" "}
                of {totalPages}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-xl"
                disabled={page === totalPages}
                onClick={() =>
                  setPage(
                    (previous) =>
                      previous + 1
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
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