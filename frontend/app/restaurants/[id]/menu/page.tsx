"use client"

import {
  type ReactNode,
  useEffect,
  useState,
} from "react"

import {
  useParams,
  useRouter,
} from "next/navigation"

import { useAppStore } from "@/lib/store"

import { MenuContent } from "@/components/menu-content"
import { YourOrder } from "@/components/order-content"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import Loading from "@/components/loading"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createReservation,
  updateReservationOrders,
} from "@/lib/services/reservation.service"

import {
  getMenuByRestaurant,
  getRestaurantById,
} from "@/lib/services/restaurant.service"

import type {
  MenuItem,
  Restaurant,
} from "@/lib/types/restaurant.types"

import type {
  ReservationRequest,
  ReservationResponse,
} from "@/lib/types/reservation.types"

import {
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


interface ReservationDetailProps {
  icon: ReactNode
  label: string
  value: ReactNode
}

function ReservationDetail({
  icon,
  label,
  value,
}: ReservationDetailProps) {
  return (
    <div className="flex items-start gap-3">

      <div className="mt-0.5 shrink-0 text-muted-foreground">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <div className="mt-0.5 text-sm font-medium leading-snug">
          {value}
        </div>

      </div>

    </div>
  )
}


export default function MenuPage() {
  const params = useParams()
  const router = useRouter()

  const id = Number(params.id)


  const {
    currentReservationRequest,
    setCurrentReservationRequest,

    currentReservationResponse,
    setCurrentReservationResponse,

    cart,
    selectedTable,
  } = useAppStore()


  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null)

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([])

  const [availableSlots, setAvailableSlots] =
    useState<string[]>([])

  const [servingTime, setServingTime] =
    useState("")

  const [loading, setLoading] =
    useState(true)


  const generateServingSlots = (
    startTime: string
  ) => {
    const [hours, minutes] =
      startTime
        .split(":")
        .map(Number)

    const slots: string[] = []

    for (let i = 0; i <= 4; i++) {
      const totalMinutes =
        hours * 60 +
        minutes +
        i * 15

      const h =
        Math.floor(
          totalMinutes / 60
        )

      const m =
        totalMinutes % 60

      slots.push(
        `${h
          .toString()
          .padStart(
            2,
            "0"
          )}:${m
          .toString()
          .padStart(
            2,
            "0"
          )}`
      )
    }

    return slots
  }


  useEffect(() => {
    if (!currentReservationRequest) {
      return
    }


    const init = async () => {
      setLoading(true)

      try {
        const [
          restaurantResponse,
          menuResponse,
        ] = await Promise.all([
          getRestaurantById(
            currentReservationRequest.restaurantId
          ),

          getMenuByRestaurant(
            currentReservationRequest.restaurantId
          ),
        ])


        setRestaurant(
          restaurantResponse?.restaurant ??
            null
        )


        setMenuItems(
          menuResponse.items
        )


        const slots =
          generateServingSlots(
            currentReservationRequest.startTime
          )


        setAvailableSlots(
          slots
        )


        setServingTime(
          currentReservationRequest.servingTime ??
            currentReservationRequest.startTime
        )

      } finally {
        setLoading(false)
      }
    }


    void init()

  }, [currentReservationRequest])


  if (!currentReservationRequest) {
    return (
      <PageContainer>

        <div className="mx-auto max-w-md py-16 text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Start a reservation first
          </h1>

          <p className="mt-2 text-muted-foreground">
            Choose your date, time and table
            before selecting food.
          </p>

          <Button
            type="button"
            className="mt-6 rounded-xl"
            onClick={() =>
              router.push(
                `/restaurants/${id}`
              )
            }
          >
            Back to Restaurant
          </Button>

        </div>

      </PageContainer>
    )
  }


  if (loading) {
    return <Loading />
  }


  if (!restaurant) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-md py-16 text-center">

          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
            <MapPin className="h-5 w-5 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            Restaurant not found
          </h1>

          <p className="mt-2 text-muted-foreground">
            We couldn&apos;t find the restaurant
            for this reservation.
          </p>


          <Button
            type="button"
            className="mt-6 rounded-xl"
            onClick={() =>
              router.push(
                "/restaurants"
              )
            }
          >
            Browse Restaurants
          </Button>

        </div>

      </PageContainer>
    )
  }


  const handleProceed = async () => {
    const request: ReservationRequest = {
      ...currentReservationRequest,


      orders: cart.map(
        (item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })
      ),


      servingTime:
        cart.length > 0
          ? servingTime ||
            currentReservationRequest.startTime
          : undefined,
    }


    setCurrentReservationRequest(
      request
    )


    try {
      let reservation:
        ReservationResponse


      /*
       * Reservation may already exist if the
       * user previously created the booking.
       *
       * In that case we only update the food
       * preorder.
       *
       * Otherwise we create the reservation
       * together with the selected food.
       */
      if (currentReservationResponse) {
        reservation =
          await updateReservationOrders(
            currentReservationResponse.id,
            {
              orders:
                request.orders,

              servingTime:
                request.servingTime,
            }
          )
      } else {
        reservation =
          await createReservation(
            request
          )
      }


      setCurrentReservationResponse(
        reservation
      )


      /*
       * No food was selected.
       *
       * The table reservation is confirmed and
       * no payment is required.
       */
      if (
        reservation.status ===
          "Confirmed" &&
        reservation.paymentStatus ===
          "NotRequired"
      ) {
        router.push(
          `/confirmation?reservationId=${reservation.id}`
        )

        return
      }


      /*
       * Food preorder exists.
       *
       * Payment is NOT started here.
       *
       * Checkout owns the payment flow and will
       * call startReservationPayment().
       *
       * Failed is also allowed because the user
       * may return to checkout and retry payment.
       */
      if (
        reservation.status ===
          "Confirmed" &&
        (
          reservation.paymentStatus ===
            "NotStarted" ||
          reservation.paymentStatus ===
            "Failed"
        )
      ) {
        router.push(
          "/checkout"
        )

        return
      }


      console.error(
        "Unexpected reservation state:",
        reservation.status,
        reservation.paymentStatus
      )

    } catch (error) {
      console.error(
        "Failed to create/update reservation:",
        error
      )
    }
  }


  return (
    <PageContainer>
      {/* Back navigation */}
      <Button
        type="button"
        variant="ghost"
        className="-ml-2 mb-4 text-muted-foreground"
        onClick={() =>
          router.push(
            `/restaurants/${id}`
          )
        }
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Restaurant
      </Button>

      {/* Page heading */}
      <PageHeader
        title="Pre-order Your Meal"
        description="Choose your dishes and serving time before checkout if you'd like to pre-order"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* ==================================================
            MENU
        ================================================== */}

        <MenuContent
          menuItems={menuItems}
        />


        {/* ==================================================
            SIDEBAR
        ================================================== */}

        <aside className="h-fit space-y-4 lg:sticky lg:top-24">


          {/* Reservation Details */}
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>

                <div>
                  <CardTitle className="text-base">
                    Reservation Details
                  </CardTitle>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Review your booking before checkout
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">

              <ReservationDetail
                icon={
                  <MapPin className="h-4 w-4" />
                }
                label="Restaurant"
                value={restaurant.name}
              />


              <ReservationDetail
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
                label="Date"
                value={
                  formatDate(
                    currentReservationRequest.date
                  )
                }
              />


              <ReservationDetail
                icon={
                  <Clock className="h-4 w-4" />
                }
                label="Reservation Time"
                value={
                  formatTime(
                    currentReservationRequest.startTime
                  )
                }
              />


              <ReservationDetail
                icon={
                  <Users className="h-4 w-4" />
                }
                label="Party Size"
                value={
                  formatGuestCount(
                    currentReservationRequest.guestNumber
                  )
                }
              />


              <ReservationDetail
                icon={
                  <Armchair className="h-4 w-4" />
                }
                label="Table"
                value={
                  selectedTable
                    ? `${selectedTable.location} · ${selectedTable.seats} seats`
                    : "Selected table"
                }

              />

              {/* Serving time */}
              {cart.length > 0 && (
                <>

                  <Separator />


                  <div className="rounded-xl bg-muted/30 p-3">

                    <div className="mb-3 flex items-center gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background">

                        <Clock className="h-4 w-4 text-primary" />

                      </div>


                      <div>

                        <p className="text-sm font-medium">
                          Serving Time
                        </p>

                        <p className="mt-0.5 text-xs text-muted-foreground">
                          When should your meal be ready?
                        </p>

                      </div>

                    </div>


                    <Select
                      value={
                        servingTime
                      }
                      onValueChange={
                        setServingTime
                      }
                    >

                      <SelectTrigger className="w-full bg-background">

                        <SelectValue
                          placeholder="Select serving time"
                        />

                      </SelectTrigger>


                      <SelectContent>

                        {availableSlots.map(
                          (slot) => (

                            <SelectItem
                              key={slot}
                              value={slot}
                            >
                              {formatTime(
                                slot
                              )}
                            </SelectItem>

                          )
                        )}

                      </SelectContent>

                    </Select>

                  </div>

                </>
              )}

            </CardContent>

          </Card>


          {/* Order */}
          <YourOrder
            onProceed={
              handleProceed
            }
          />

        </aside>

      </div>

    </PageContainer>
  )
}