"use client"

import { useRouter } from "next/navigation"

import { useAppStore } from "@/lib/store"

import { Payment } from "@/components/payment-content"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import Loading from "@/components/loading"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  formatCurrency,
  formatDate,
  formatGuestCount,
  formatTime,
} from "@/lib/formatters"

import {
  ArrowLeft,
  Armchair,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  UtensilsCrossed,
} from "lucide-react"


export function CheckoutContent() {
  const router = useRouter()

  const {
    currentReservationRequest,
    currentReservationResponse,
  } = useAppStore()


  if (
    !currentReservationRequest ||
    !currentReservationResponse
  ) {
    return <Loading />
  }


  const reservation =
    currentReservationResponse


  const backToMenuUrl =
    `/restaurants/${currentReservationRequest.restaurantId}/menu`


  return (
    <PageContainer className="max-w-6xl">

      {/* =====================================================
          BACK
      ===================================================== */}

      <Button
        type="button"
        variant="ghost"
        className="-ml-2 mb-4 text-muted-foreground"
        onClick={() =>
          router.push(backToMenuUrl)
        }
      >
        <ArrowLeft className="mr-2 h-4 w-4" />

        Back to Menu
      </Button>


      {/* =====================================================
          PAGE HEADER
      ===================================================== */}
      
      <PageHeader
        title="Checkout"
        description="Review your reservation and complete the payment for your food pre-order"
      />

      {/* =====================================================
          CHECKOUT CARD
      ===================================================== */}

      <Card className="overflow-hidden rounded-2xl border shadow-sm">

        {/* ===================================================
            BOOKING OVERVIEW
        =================================================== */}

        <div className="border-b bg-muted/10 p-5 sm:p-6">

          {/* Restaurant */}
          <div className="flex items-start gap-3">

            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">

              <MapPin className="h-4 w-4 text-primary" />

            </div>


            <div className="min-w-0">

              <h2 className="text-base font-semibold">
                {reservation.restaurantName}
              </h2>

              <p className="mt-0.5 text-sm text-muted-foreground">
                {reservation.restaurantAddress}
                {", "}
                {reservation.restaurantCity}
              </p>

            </div>

          </div>


          {/* Reservation information */}
          <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">


            {/* Date */}
            <div className="flex items-start gap-3">

              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0">

                <p className="text-xs text-muted-foreground">
                  Date
                </p>

                <p className="mt-0.5 text-sm font-medium leading-snug">
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

              <div className="min-w-0">

                <p className="text-xs text-muted-foreground">
                  Table
                </p>

                <p className="mt-0.5 text-sm font-medium leading-snug">
                  {reservation.tableLocation} · {reservation.tableSeats} seats
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* ===================================================
            PRE-ORDER + PAYMENT
        =================================================== */}

        <CardContent className="p-0">

          <div className="grid lg:grid-cols-[minmax(0,1fr)_460px]">


            {/* =================================================
                PRE-ORDER
            ================================================= */}

            <section className="p-5 sm:p-6 lg:p-7">

              {/* Header */}
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                <div>

                  <div className="flex items-center gap-2">

                    <UtensilsCrossed className="h-4 w-4 text-primary" />

                    <h3 className="text-base font-semibold">
                      Your pre-order
                    </h3>

                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Food prepared for your reservation
                  </p>

                </div>


                {reservation.servingTime && (
                  <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs">

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


              {reservation.orders.length > 0 ? (

                <div>

                  {/* Order items */}
                  <div>

                    {reservation.orders.map(
                      (item, index) => (

                        <div
                          key={item.menuItemId}
                        >

                          <div className="flex items-center justify-between gap-4 py-3">

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-sm font-semibold">
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
                            <Separator />
                          )}

                        </div>

                      )
                    )}

                  </div>


                  {/* Total */}
                  <Separator className="my-4" />


                  <div className="flex items-end justify-between gap-4">

                    <div>

                      <p className="text-xs text-muted-foreground">
                        Order total
                      </p>

                      <p className="mt-0.5 text-sm font-semibold">
                        Total
                      </p>

                    </div>


                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        reservation.totalAmount
                      )}
                    </span>

                  </div>

                </div>

              ) : (

                <div className="rounded-xl border border-dashed p-6 text-center">

                  <p className="text-sm font-medium">
                    No food pre-order
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    This reservation does not contain any food items.
                  </p>

                </div>

              )}

            </section>


            {/* =================================================
                PAYMENT
            ================================================= */}

            <section
              className="
                border-t
                bg-muted/5
                p-5
                sm:p-6
                lg:border-l
                lg:border-t-0
                lg:p-7
              "
            >
              <Payment />
            </section>

          </div>

        </CardContent>

      </Card>

    </PageContainer>
  )
}