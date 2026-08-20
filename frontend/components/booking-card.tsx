"use client"

import type {
  ReactNode,
} from "react"

import Link from "next/link"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
  Armchair,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react"

import {
  formatCurrency,
  formatDate,
  formatGuestCount,
  formatTime,
} from "@/lib/formatters"

import type {
  ReservationResponse,
} from "@/lib/types/reservation.types"

interface BookingCardProps {
  reservation: ReservationResponse
  showActions?: boolean
  onCancel?: () => void
}

interface BookingDetailProps {
  icon: ReactNode
  label: string
  value: ReactNode
}

function BookingDetail({
  icon,
  label,
  value,
}: BookingDetailProps) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <div className="mt-0.5 shrink-0 text-muted-foreground">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] leading-none text-muted-foreground">
          {label}
        </p>

        <div className="mt-1 whitespace-nowrap text-sm font-semibold leading-tight">
          {value}
        </div>
      </div>
    </div>
  )
}

export function BookingCard({
  reservation,
  showActions = false,
  onCancel,
}: BookingCardProps) {
  const preOrderItems =
    reservation.orders ?? []

  return (
    <Card className="overflow-hidden rounded-2xl border shadow-sm">
      <CardHeader className="px-5 pb-3 pt-5 sm:px-6">
        <CardTitle className="text-lg">
          {reservation.restaurantName}
        </CardTitle>

        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />

          <span className="truncate">
            {reservation.restaurantAddress},{" "}
            {reservation.restaurantCity}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-5 pb-5 sm:px-6">
        {/* Reservation details */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 rounded-xl bg-muted/35 p-3.5 md:grid-cols-[1.45fr_0.6fr_0.9fr_1.2fr] md:gap-y-0">
          <BookingDetail
            icon={
              <CalendarDays className="h-4 w-4" />
            }
            label="Date"
            value={
              formatDate(
                reservation.date
              )
            }
          />

          <BookingDetail
            icon={
              <Clock className="h-4 w-4" />
            }
            label="Time"
            value={
              formatTime(
                reservation.startTime
              )
            }
          />

          <BookingDetail
            icon={
              <Users className="h-4 w-4" />
            }
            label="Party Size"
            value={
              formatGuestCount(
                reservation.guestNumber
              )
            }
          />

          <BookingDetail
            icon={
              <Armchair className="h-4 w-4" />
            }
            label="Table"
            value={`${reservation.tableLocation} · ${reservation.tableSeats} seats`}
          />
        </div>

        {/* Pre-order */}
        {preOrderItems.length > 0 && (
          <>
            <Separator className="my-4" />

            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4 text-primary" />

                <h4 className="text-sm font-semibold">
                  Food Pre-order
                </h4>
              </div>

              {reservation.servingTime && (
                <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />

                  <span className="text-muted-foreground">
                    Serve at
                  </span>

                  <span className="font-medium">
                    {formatTime(
                      reservation.servingTime
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="divide-y">
              {preOrderItems.map(
                (item) => (
                  <div
                    key={
                      item.menuItemId
                    }
                    className="flex items-center justify-between gap-4 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {item.foodName}
                      </p>

                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatCurrency(
                          item.price
                        )}{" "}
                        × {item.quantity}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm font-medium">
                      {formatCurrency(
                        item.total
                      )}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/30 px-4 py-2.5">
              <span className="text-sm font-semibold">
                Total
              </span>

              <span className="text-lg font-bold text-primary">
                {formatCurrency(
                  reservation.totalAmount
                )}
              </span>
            </div>
          </>
        )}

        {/* Actions */}
        {showActions &&
          reservation.status !==
            "Cancelled" && (
            <>
              <Separator className="my-4" />

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href={`/restaurants/${reservation.restaurantId}`}
                  className="w-full sm:w-auto"
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl sm:w-auto"
                  >
                    View Restaurant
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger
                    asChild
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full rounded-xl text-destructive hover:bg-destructive/5 hover:text-destructive sm:w-auto"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Cancel Reservation?
                      </AlertDialogTitle>

                      <AlertDialogDescription>
                        Are you sure you want to cancel your reservation at{" "}
                        {
                          reservation.restaurantName
                        }
                        ? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl">
                        Keep Reservation
                      </AlertDialogCancel>

                      <AlertDialogAction
                        onClick={
                          onCancel
                        }
                        className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Cancel Reservation
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
      </CardContent>
    </Card>
  )
}