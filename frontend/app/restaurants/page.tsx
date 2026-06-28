// "use client"

// import { useCallback, useEffect, useState } from "react"
// import Loading from "@/components/loading"
// import { RestaurantCard } from "@/components/restaurant-card"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { Search, SlidersHorizontal } from "lucide-react"

// import type {
//   Restaurant,
//   RestaurantQueryRequest,
// } from "@/lib/types/restaurant.types"

// import {
//   getRestaurants,
//   getRestaurantFilters,
// } from "@/lib/services/restaurant.service"

// import { useAppStore } from "@/lib/store"

// export default function RestaurantsPage() {
//   const [restaurants, setRestaurants] = useState<Restaurant[]>([])
//   const [cuisines, setCuisines] = useState<string[]>([])
//   const [rangePrices, setRangePrices] = useState<string[]>([])
//   const [loading, setLoading] = useState(true)
//   const [hasSearched, setHasSearched] = useState(false)

//   const [searchQuery, setSearchQuery] = useState("")
//   const [cuisineFilter, setCuisineFilter] = useState("all")
//   const [priceFilter, setPriceFilter] = useState("all")
//   const [sortBy, setSortBy] = useState<"rating" | "name">("rating")

//   const {
//     setSelectedTable,
//     clearCart,
//     setCurrentReservationRequest,
//     setCurrentReservationResponse,
//   } = useAppStore()

//   const handleSearch = useCallback(
//     async (params?: RestaurantQueryRequest) => {
//       setLoading(true)
//       setHasSearched(true)

//       const response = await getRestaurants({
//         search: params?.search ?? searchQuery,
//         cuisine: params?.cuisine ?? cuisineFilter,
//         price: params?.price ?? priceFilter,
//         sortBy: params?.sortBy ?? sortBy,
//       })

//       setRestaurants(response.restaurants)
//       setLoading(false)
//     },
//     [searchQuery, cuisineFilter, priceFilter, sortBy]
//   )

//   useEffect(() => {
//     const init = async () => {
//       setSelectedTable(null)
//       clearCart()
//       setCurrentReservationRequest(null)
//       setCurrentReservationResponse(null)

//       setLoading(true)

//       const filters = await getRestaurantFilters()

//       setCuisines(filters.cuisines)
//       setRangePrices(filters.rangePrices)

//       await handleSearch({ sortBy: "rating" })
//     }

//     void init()
//   }, [])

//   return (
//     <div className="min-h-screen py-6">
//       <div className="container mx-auto px-4">
//         <div className="mb-8">
//           <h1 className="md:text-3xl font-bold mb-2">Restaurants</h1>
//           <p className="text-muted-foreground mb-6">
//             Discover and book tables at the best restaurants
//           </p>
//         </div>

//         <div className="bg-card border rounded-lg p-4 mb-6">
//           <div className="flex flex-col lg:flex-row gap-4">
//             <div className="flex-1 relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
//               <Input
//                 placeholder="Search restaurants..."
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//                 className="pl-10"
//               />
//             </div>

//             <div className="flex flex-wrap gap-3">
//               <Select value={cuisineFilter} onValueChange={setCuisineFilter}>
//                 <SelectTrigger className="w-[150px]">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Cuisines</SelectItem>
//                   {cuisines.map((cuisine) => (
//                     <SelectItem key={cuisine} value={cuisine}>
//                       {cuisine}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>

//               <Select value={priceFilter} onValueChange={setPriceFilter}>
//                 <SelectTrigger className="w-[130px]">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Prices</SelectItem>
//                   {rangePrices.map((price) => (
//                     <SelectItem key={price} value={price}>
//                       {price}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>

//               <Select
//                 value={sortBy}
//                 onValueChange={(value) =>
//                   setSortBy(value as "rating" | "name")
//                 }
//               >
//                 <SelectTrigger className="w-[140px]">
//                   <SlidersHorizontal className="mr-2 h-4 w-4" />
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="rating">Top Rated</SelectItem>
//                   <SelectItem value="name">Name A-Z</SelectItem>
//                 </SelectContent>
//               </Select>

//               <Button onClick={() => handleSearch()}>
//                 Apply Filters
//               </Button>
//             </div>
//           </div>
//         </div>

//         {loading && <Loading />}

//         {!loading && restaurants.length > 0 && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {restaurants.map((restaurant) => (
//               <RestaurantCard key={restaurant.id} restaurant={restaurant} />
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }


"use client"

import { useCallback, useEffect, useState } from "react"
import Loading from "@/components/loading"
import { RestaurantCard } from "@/components/restaurant-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, SlidersHorizontal } from "lucide-react"

import type {
  Restaurant,
  RestaurantQueryRequest,
} from "@/lib/types/restaurant.types"

import {
  getRestaurants,
  getRestaurantFilters,
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

      const response = await getRestaurants({
        search: params?.search ?? searchQuery,
        cuisine: params?.cuisine ?? cuisineFilter,
        price: params?.price ?? priceFilter,
        sortBy: params?.sortBy ?? sortBy,
      })

      setRestaurants(response.restaurants)
      setLoading(false)
    },
    [searchQuery, cuisineFilter, priceFilter, sortBy]
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

      await handleSearch({ sortBy: "rating" })
    }

    void init()
  }, [])

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="md:text-3xl font-bold mb-2">Restaurants</h1>
          <p className="text-muted-foreground mb-6">
            Discover and book tables at the best restaurants
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
              <Input
                placeholder="Search restaurants..."
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
                  {rangePrices.map((price) => (
                    <SelectItem key={price} value={price}>
                      {price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) =>
                  setSortBy(value as "rating" | "name")
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => handleSearch()}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && <Loading />}

        {/* Results */}
        {!loading && restaurants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={{
                  ...restaurant,
                  image: restaurant.image
                    ? `data:image/jpeg;base64,${restaurant.image}`
                    : "/placeholder.svg",
                }}
              />
            ))} */}

            {restaurants.map((restaurant) => {
              const restaurantWithImage = {
                ...restaurant,
                image: restaurant.image
                  ? `data:image/jpeg;base64,${restaurant.image}`
                  : "/placeholder.svg",
              }

              return (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurantWithImage}
                />
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && hasSearched && restaurants.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-lg font-semibold mb-2">
              No restaurants found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters
            </p>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setCuisineFilter("all")
                setPriceFilter("all")

                void handleSearch({
                  search: "",
                  cuisine: "all",
                  price: "all",
                  sortBy,
                })
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}