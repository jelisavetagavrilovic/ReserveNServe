"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Restaurant, Table } from "@/lib/types"
import { format, parse } from "date-fns"
import { getRestaurantById, getTableById } from "@/lib/services/restaurant.service"
import { useEffect, useState } from "react"
import { ReservationResponse } from "@/lib/types/reservation.types"

import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Armchair,
  Utensils,
  Phone,
} from "lucide-react"

type Props = {
  reservation: ReservationResponse
  mode: "checkout" | "confirmation"
}

export function ReservationSummary({ reservation, mode }: Props) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [table, setTable] = useState<Table | null>(null)

  useEffect(() => {
    const init = async () => {
      if (reservation.restaurantId) {
        const r = await getRestaurantById(reservation.restaurantId)
        console.log("Fetched restaurant:", r)
        setRestaurant(r ?? null)
      }

      if (reservation.tableGroupId) {
        const t = await getTableById(reservation.tableGroupId)
        console.log("Fetched table:", t)
        setTable(t ?? null)
      }
    }
    init()
  }, [reservation.restaurantId, reservation.tableGroupId])

  return (
    <div className="lg:sticky lg:top-24h-fit">
      <Card>
        {mode === "checkout" && (
          <CardHeader>
            <CardTitle className="text-lg">Reservation Summary</CardTitle>
          </CardHeader>
        )}  

        {mode === "confirmation" && (
          <div className="bg-primary/10 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Confirmation Number</p>
                <p className="text-lg font-mono font-bold">{reservation.id.toString()}</p>
              </div>
            </div>
          </div>
        )}

        <CardContent className="space-y-4">
          {/* restaurant */}
          {restaurant && mode === "checkout" && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{restaurant.name}</p>
                <p className="text-sm text-muted-foreground">
                  {restaurant.address}, {restaurant.city}
                </p>
              </div>
            </div>
          )}
          {restaurant && mode === "confirmation" && (
            <>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{restaurant.name}</h2>
                  <p className="text-muted-foreground">{restaurant.cusine_type}</p>
                </div>
              </div>
                
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{restaurant.address}</p>
                  <p className="text-muted-foreground">{restaurant.city}</p>
                </div>
              </div><div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p>{restaurant.phone_number}</p>
              </div>

              <Separator />
            </>
          )}  

          {/* date */}
          {reservation.date && (
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <p>
                {format(
                  parse(reservation.date, "yyyy-MM-dd", new Date()),
                  "EEEE, MMMM d, yyyy"
                )}
              </p>
            </div>
          )}

          {/* time */}
          {reservation.startTime && (
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <p>{reservation.startTime}</p>
            </div>
          )}

          {/* guests */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p>{reservation.guestNumber} guests</p>
          </div>

          {/* table */}
          {table && (
            <div className="flex items-center gap-3">
              <Armchair className="h-5 w-5 text-muted-foreground" />
              <p>
                Table {table.location} ({table.seats} seats)
              </p>
            </div>
          )}

          {/* pre-order */}
          {reservation.orders && reservation.orders.length > 0 && (
            <>
              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Utensils className="h-4 w-4" />
                  <span className="font-medium">Pre-ordered Items</span>

                  {reservation.servingTime && (
                    <span className="text-sm text-muted-foreground">
                      (Serve at {reservation.servingTime})
                    </span>
                  )}
                </div>

              <div className="space-y-2 rounded-lg p-4">
                {reservation.orders.map(
                  (item) =>
                    item && (
                      <div key={item.menuItemId} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}x {item.foodName}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ),
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-semibold">
                  <span>
                    {mode === "checkout" ? "Total" : "Total Paid"}
                  </span>
                  <span className="text-primary">${reservation.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}