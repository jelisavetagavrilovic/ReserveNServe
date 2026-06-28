"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { format, parse } from "date-fns"
import { ReservationResponse } from "@/lib/types/reservation.types"

import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Armchair,
  Utensils,
} from "lucide-react"

type Props = {
  reservation: ReservationResponse
  mode: "checkout" | "confirmation"
}

export function ReservationSummary({ reservation, mode }: Props) {
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
                <p className="text-sm text-muted-foreground">
                  Confirmation Number
                </p>
                <p className="text-lg font-mono font-bold">
                  {reservation.id}
                </p>
              </div>
            </div>
          </div>
        )}

        <CardContent className="space-y-4">
          {/* restaurant */}
          {mode === "checkout" && (
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{reservation.restaurantName}</p>
                <p className="text-sm text-muted-foreground">
                  {reservation.restaurantAddress}, {reservation.restaurantCity}
                </p>
              </div>
            </div>
          )}

          {mode === "confirmation" && (
            <>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Utensils className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">
                    {reservation.restaurantName}
                  </h2>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">
                    {reservation.restaurantAddress}
                  </p>
                  <p className="text-muted-foreground">
                    {reservation.restaurantCity}
                  </p>
                </div>
              </div>

              <Separator />
            </>
          )}

          {/* date */}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <p>
              {format(
                parse(reservation.date, "yyyy-MM-dd", new Date()),
                "EEEE, MMMM d, yyyy"
              )}
            </p>
          </div>

          {/* time */}
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <p>{reservation.startTime}</p>
          </div>

          {/* guests */}
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p>{reservation.guestNumber} guests</p>
          </div>

          {/* table */}
          <div className="flex items-center gap-3">
            <Armchair className="h-5 w-5 text-muted-foreground" />
            <p>
              Table {reservation.tableLocation} ({reservation.tableSeats} seats)
            </p>
          </div>

          {/* pre-order */}
          {reservation.orders.length > 0 && (
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
                  {reservation.orders.map((item) => (
                    <div
                      key={item.menuItemId}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.quantity}x {item.foodName}
                      </span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}

                  <Separator className="my-2" />

                  <div className="flex justify-between font-semibold">
                    <span>
                      {mode === "checkout" ? "Total" : "Total Paid"}
                    </span>
                    <span className="text-primary">
                      ${reservation.totalAmount.toFixed(2)}
                    </span>
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