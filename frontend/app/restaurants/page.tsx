"use client"

import { useState, useEffect } from "react"
import Loading from "@/components/loading"
import { RestaurantCard } from "@/components/restaurant-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal } from "lucide-react"
import { Restaurant } from "@/lib/types"
import { getCuisines, getRangePrices, getRestaurants } from "@/lib/services/restaurant.service"
import { deleteReservation } from "@/lib/services/reservation.service"
import { useAppStore } from "@/lib/store"

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [cuisines, setCuisines] = useState<string[]>([])
  const [rangePrices, setRangePrices] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [cuisineFilter, setCuisineFilter] = useState<string>("all")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"rating" | "name">("rating")

  const {
    setSelectedTable, 
    clearCart,
    currentReservation, setCurrentReservation
  } = useAppStore()

  // load cuisines once and restaurants with default filters 
  useEffect(() => {
    const init = async () => {
      setSelectedTable(null)
      clearCart()
      if (currentReservation?.status == "pending" && currentReservation.id)
        deleteReservation(currentReservation.id)
      setCurrentReservation(null)

      setLoading(true)

      const [ 
        // restaurantsData, 
        cuisinesData, rangePriceData] = await Promise.all([
        // getRestaurants(),
        getCuisines(),
        getRangePrices(),
      ])

      // setRestaurants(restaurantsData)
      setCuisines(cuisinesData)
      setRangePrices(rangePriceData)

      await handleSearch({ sortBy: "rating" })

      setLoading(false)
      setHasSearched(true)
    }

    init()
  }, [])

  // load restaurants with filters
  const handleSearch = async (params?: {
    search?: string
    cuisine?: string
    price?: string
    sortBy?: "rating" | "name"
  }) => {
    setLoading(true)
    setHasSearched(true)

    const data = await getRestaurants({
      search: params?.search ?? searchQuery,
      cuisine: params?.cuisine ?? cuisineFilter,
      price: params?.price ?? priceFilter,
      sortBy: params?.sortBy ?? sortBy,
    })

    setRestaurants(data)
    setLoading(false)
  }


  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        {/* header */}
        <div className="mb-8">
          {/* <h1 className="text-3xl">Restaurants</h1> */}
          <h1 className="md:text-3xl font-bold mb-2">Restaurants</h1>
          <p className="text-muted-foreground mb-6">Discover and book tables at the best restaurants</p>
        </div>

        {/* filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search restaurants, cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  {cuisines.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  {rangePrices.map((rangePrice) => (
                    <SelectItem key={rangePrice} value={rangePrice}>
                      {rangePrice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as "rating" | "name")}>
                <SelectTrigger className="w-[140px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => {
                  handleSearch()
                }}
              >
                Apply Filters
              </Button>

            </div>
          </div>
        </div>

        {/* results */}
        {loading && <Loading />}
        {!loading && restaurants.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </>
        )}
        {!loading && hasSearched && restaurants.length === 0 && (
        <>
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              onClick={() => {
                handleSearch({
                  search: "",
                  cuisine: "all",
                  price: "all",
                  sortBy,
                })

                setSearchQuery("")
                setCuisineFilter("all")
                setPriceFilter("all")
              }}
            >
              Clear Filters
            </Button>`
          </div>
        </>
        )}
      </div>
    </div>
  )
}
