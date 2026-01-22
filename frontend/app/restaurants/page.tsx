"use client"

import { useState, useMemo } from "react"
import { RestaurantCard } from "@/components/restaurant-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal } from "lucide-react"

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [cuisineFilter, setCuisineFilter] = useState<string>("all")
  const [priceFilter, setPriceFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("rating")

  // todo: fetch this data from an API
  const restaurants = [
    {
      id: 1,
      name: "Pizza Palace",
      description: "Authentic Italian pizza with fresh ingredients bdhwecviw cbewibcfhwcb bchwbhv bdhqecviewvceyewgcyvchvwgvwuvyewvbcevbcwyivi",
      city: "Belgrade",
      address: "Knez Mihailova 12",
      phone_number: "+381 64 123 45 67",
      opening_time_workday: "10:00",
      closing_time_workday: "22:00",
      opening_time_weekend: "11:00",
      closing_time_weekend: "23:00",
      rating: 4.5,
      price_range: "$$",
      cusine_type: "Italian",
      reservation_duration: "03:00:00",
    },
    {
      id: 2,
      name: "Sushi Spot",
      description: "Fresh sushi prepared by expert chefs",
      city: "Novi Sad",
      address: "Zmaj Jovina 45",
      phone_number: "+381 63 987 65 43",
      opening_time_workday: "11:00",
      closing_time_workday: "21:00",
      opening_time_weekend: "12:00",
      closing_time_weekend: "22:00",
      rating: 4.8,
      price_range: "$$$",
      cusine_type: "Japanese",
      reservation_duration: "03:00:00",
    },
    {
      id: 3,
      name: "Balkan Bistro",
      description: "Traditional Balkan dishes in a cozy atmosphere",
      city: "Belgrade",
      address: "Kralja Petra 8",
      phone_number: "+381 65 555 44 33",
      opening_time_workday: "09:00",
      closing_time_workday: "23:00",
      opening_time_weekend: "10:00",
      closing_time_weekend: "23:30",
      rating: 4.2,
      price_range: "$$",
      cusine_type: "Balkan",
      reservation_duration: "03:00:00",
    },
    {
      id: 4,
      name: "Le Gourmet",
      description: "Fine dining French cuisine with wine pairing",
      city: "Novi Sad",
      address: "Bulevar Oslobođenja 15",
      phone_number: "+381 62 112 22 33",
      opening_time_workday: "12:00",
      closing_time_workday: "23:00",
      opening_time_weekend: "12:00",
      closing_time_weekend: "23:30",
      rating: 4.9,
      price_range: "$$$",
      cusine_type: "French",
      reservation_duration: "03:00:00",
    },
    {
      id: 5,
      name: "Mediterraneo",
      description: "Mediterranean flavors with a modern twist",
      city: "Belgrade",
      address: "Njegoševa 20",
      phone_number: "+381 64 777 88 99",
      opening_time_workday: "10:00",
      closing_time_workday: "22:30",
      opening_time_weekend: "11:00",
      closing_time_weekend: "23:00",
      rating: 4.6,
      price_range: "$$$",
      cusine_type: "Mediterranean",
      reservation_duration: "03:00:00",
    },
  ];

  const cuisines = Array.from(new Set(restaurants.map(r => r.cusine_type)));

  // todo: implement queries to filtering and sorting, no in frontend
  const filteredRestaurants = useMemo(() => {
    let results = [...restaurants];

    // search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.cusine_type.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query)
      );
    }

    // cuisine filter
    if (cuisineFilter !== "all") {
      results = results.filter((r) => r.cusine_type === cuisineFilter);
    }

    // price filter
    if (priceFilter !== "all") {
      results = results.filter((r) => r.price_range === priceFilter);
    }

    // sort
    switch (sortBy) {
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "name":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return results;
  }, [searchQuery, cuisineFilter, priceFilter, sortBy]);

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        {/* header */}
        <div className="mb-8">
          <h1 className="text-3xl">Restaurants</h1>
          <p className="text-muted-foreground">Discover and book tables at the best restaurants</p>
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
                  <SelectItem value="$">$</SelectItem>
                  <SelectItem value="$$">$$</SelectItem>
                  <SelectItem value="$$$">$$$</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* results */}
        {filteredRestaurants.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No restaurants found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setCuisineFilter("all")
                setPriceFilter("all")
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
