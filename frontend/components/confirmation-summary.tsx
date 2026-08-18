import type {
  ReservationResponse,
} from "@/lib/types/reservation.types"

import {
  formatCurrency,
  formatDate,
  formatGuestCount,
  formatTime,
} from "@/lib/formatters"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import { Separator } from "@/components/ui/separator"

import {
  Armchair,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  UtensilsCrossed,
} from "lucide-react"


interface ConfirmationSummaryProps {
  reservation: ReservationResponse
}


export function ConfirmationSummary({
  reservation,
}: ConfirmationSummaryProps) {
  const hasPreOrder =
    reservation.orders.length > 0

  const paymentSucceeded =
    reservation.paymentStatus === "Succeeded"


  return (
    <Card className="overflow-hidden rounded-2xl border shadow-sm">

      {/* Confirmation number */}
      <div className="border-b bg-primary/5 px-5 py-4">

        <p className="text-xs text-muted-foreground">
          Confirmation Number
        </p>

        <p className="mt-1 break-all font-mono text-sm font-semibold">
          {reservation.id}
        </p>
      </div>


      <CardContent className="space-y-4 p-5">

        {/* Restaurant */}
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>

            <p className="font-medium">
              {reservation.restaurantName}
            </p>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {reservation.restaurantAddress}
              {", "}
              {reservation.restaurantCity}
            </p>

          </div>
        </div>

        {/* Date */}
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>

            <p className="text-xs text-muted-foreground">
              Date
            </p>

            <p className="mt-0.5 text-sm font-medium">
              {formatDate(
                reservation.date
              )}
            </p>

          </div>
        </div>

        {/* Time */}
        <div className="flex items-start gap-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>

            <p className="text-xs text-muted-foreground">
              Time
            </p>

            <p className="mt-0.5 text-sm font-medium">
              {formatTime(
                reservation.startTime
              )}
            </p>

          </div>
        </div>

        {/* Guests */}
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>

            <p className="text-xs text-muted-foreground">
              Party Size
            </p>

            <p className="mt-0.5 text-sm font-medium">
              {formatGuestCount(
                reservation.guestNumber
              )}
            </p>

          </div>
        </div>

        {/* Table */}
        <div className="flex items-start gap-3">
          <Armchair className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div>

            <p className="text-xs text-muted-foreground">
              Table
            </p>

            <p className="mt-0.5 text-sm font-medium">
              {reservation.tableLocation} · {reservation.tableSeats} seats
            </p>

          </div>
        </div>

        {/* Pre-order */}
        {hasPreOrder && (
          <>
            <Separator />

            <div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Pre-ordered Items
                    </p>

                    {reservation.servingTime && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Serve at{" "}
                        {formatTime(
                          reservation.servingTime
                        )}
                      </p>
                    )}

                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                {reservation.orders.map(
                  (item, index) => (

                    <div
                      key={item.menuItemId}
                    >

                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.foodName}
                          </p>

                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {formatCurrency(
                              item.price
                            )}
                            {" × "}
                            {item.quantity}
                          </p>

                        </div>


                        <span className="shrink-0 text-sm font-semibold">
                          {formatCurrency(
                            item.total
                          )}
                        </span>

                      </div>


                      {index <
                        reservation.orders.length - 1 && (
                        <Separator className="mt-2.5" />
                      )}

                    </div>

                  )
                )}

              </div>

              <Separator className="my-4" />

              <div className="flex items-end justify-between">
                <div>

                  <p className="text-xs text-muted-foreground">
                    {paymentSucceeded
                      ? "Amount paid"
                      : "Order total"}
                  </p>

                  <p className="text-sm font-semibold">
                    Total
                  </p>
                </div>

                <span className="text-xl font-bold text-primary">
                  {formatCurrency(
                    reservation.totalAmount
                  )}
                </span>

              </div>

            </div>

          </>
        )}

      </CardContent>
    </Card>
  )
}