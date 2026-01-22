import Link from "next/link"
import Image from "next/image"
import type { Restaurant } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"

import { Star, MapPin, Clock } from "lucide-react"

interface RestaurantCardProps {
  restaurant: Restaurant
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group h-full">
        <div className="relative h-48 overflow-hidden">
          <Image
            src={restaurant.image || "/placeholder.svg"}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-lg text-foreground line-clamp-1">
              {restaurant.name}
            </h3>
            <span className="text-muted-foreground font-medium">{restaurant.price_range}</span>
          </div>
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{restaurant.description}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-foreground">{restaurant.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{restaurant.address}, {restaurant.city}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                Weekdays: {restaurant.opening_time_workday} - {restaurant.closing_time_workday}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                Weekend: {restaurant.opening_time_weekend} - {restaurant.closing_time_weekend}
                </span>
            </div>
            </div>

        </CardContent>
      </Card>
    </Link>
  )
}
