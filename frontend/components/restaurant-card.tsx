import Link from "next/link"
import Image from "next/image"

import type { Restaurant } from "@/lib/types/restaurant.types"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { getImageSrc } from "@/lib/utils"

import {
  Clock,
  MapPin,
  Star,
} from "lucide-react"

interface RestaurantCardProps {
  restaurant: Restaurant
}

export function RestaurantCard({
  restaurant,
}: RestaurantCardProps) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="block h-full"
    >
      <Card className="group h-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={
              getImageSrc(restaurant.image) ||
              "/placeholder.svg"
            }
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Price range */}
          <div className="absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm">
            {restaurant.price_range}
          </div>
        </div>

        <CardContent className="p-4">
          {/* Name + rating */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="line-clamp-1 text-lg font-semibold tracking-tight">
              {restaurant.name}
            </h3>

            <div className="flex shrink-0 items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">
                {restaurant.rating}
              </span>
            </div>
          </div>

          {/* Cuisine */}
          <p className="mt-0.5 text-xs font-medium text-primary">
            {restaurant.cuisine_type}
          </p>

          {/* Description */}
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {restaurant.description}
          </p>

          {/* Details */}
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-1.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {restaurant.address}, {restaurant.city}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {restaurant.opening_time} - {restaurant.closing_time}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}