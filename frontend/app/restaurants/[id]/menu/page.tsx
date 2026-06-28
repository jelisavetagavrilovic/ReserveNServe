"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { useRouter, useParams } from "next/navigation"
import { MenuContent } from "@/components/menu-content"
import { YourOrder } from "@/components/order-content"
import { Button } from "@/components/ui/button"
import { format, parse } from "date-fns"
import type {
  Restaurant,
  MenuItem,
} from "@/lib/services/restaurant.service"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card"
import {
  getRestaurantById,
  getMenuByRestaurant,
} from "@/lib/services/restaurant.service"
import {
  createReservation,
  updateReservationOrders,
} from "@/lib/services/reservation.service"
import Loading from "@/components/loading"
import {
  Clock,
  CalendarDays,
  MapPin,
  Users,
  ArrowLeft,
  Armchair,
} from "lucide-react"
import type {
  ReservationRequest,
  ReservationResponse,
} from "@/lib/types/reservation.types"

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

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [servingTime, setServingTime] = useState("")
  const [loading, setLoading] = useState(true)


  const generateServingSlots = (startTime: string) => {
    const [hours, minutes] = startTime.split(":").map(Number)

    const slots: string[] = []

    for (let i = 0; i <= 4; i++) {
      const totalMinutes = hours * 60 + minutes + i * 15

      const h = Math.floor(totalMinutes / 60)
      const m = totalMinutes % 60

      slots.push(
        `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`
      )
    }

    return slots
  }

  useEffect(() => {
    if (!currentReservationRequest) return

    const init = async () => {
      setLoading(true)

      try {
        const [restaurantResponse, menuResponse] = await Promise.all([
          getRestaurantById(currentReservationRequest.restaurantId),
          getMenuByRestaurant(currentReservationRequest.restaurantId),
        ])

        setRestaurant(restaurantResponse?.restaurant ?? null)
        setMenuItems(menuResponse.items)
        const slots = generateServingSlots(
          currentReservationRequest.startTime
        )

        setAvailableSlots(slots)
        setServingTime(currentReservationRequest.startTime)
      } finally {
        setLoading(false)
      }
    }

    void init()
  }, [currentReservationRequest])

  if (!currentReservationRequest) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Please start a reservation first
        </h1>
        <Button onClick={() => router.push(`/restaurants/${id}`)}>
          Go Back
        </Button>
      </div>
    )
  }

  if (loading) return <Loading />
  if (!restaurant) return null

  const handleProceed = async () => {
    const request: ReservationRequest = {
      ...currentReservationRequest,
      orders: cart.map((item) => ({
        menuItemId: item.id,
        quantity: item.quantity,
      })),
      servingTime:
        cart.length > 0
          ? servingTime || currentReservationRequest.startTime
          : undefined,
    }

    setCurrentReservationRequest(request)

    let reservation: ReservationResponse | undefined

    if (currentReservationResponse) {
      reservation = await updateReservationOrders(
        currentReservationResponse.id,
        request
      )

      if (!reservation) {
        console.error("Failed to update reservation")
        return
      }
    } else {
      reservation = await createReservation(request)
    }

    setCurrentReservationResponse(reservation)

    if (reservation.status === "Confirmed") {
      router.push(`/confirmation?reservationId=${reservation.id}`)
    } else if (reservation.status === "PendingPayment") {
      router.push("/checkout")
    }
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/restaurants/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Restaurant
        </Button>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Pre-order Your Meal
        </h1>

        <p className="text-muted-foreground mb-6">
          Select dishes and specify when you want them served
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MenuContent menuItems={menuItems} />
          </div>

          <div className="lg:col-span-1 sticky top-24 space-y-4">
            {/* Reservation details */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  Reservation Details
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{restaurant.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(
                      parse(
                        currentReservationRequest.date,
                        "yyyy-MM-dd",
                        new Date()
                      ),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{currentReservationRequest.startTime}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {currentReservationRequest.guestNumber} guests
                  </span>
                </div>

                {selectedTable && (
                  <div className="flex items-center gap-2">
                    <Armchair className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedTable.location} ({selectedTable.seats} seats)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Serving time */}
            <Card>
              <CardHeader className="pb-0">
                <CardTitle className="text-base">
                  When to Serve Food?
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Select value={servingTime} onValueChange={setServingTime}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select serving time" />
                  </SelectTrigger>

                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-muted-foreground mt-2">
                  Food will be ready at this time to reduce your wait
                </p>
              </CardContent>
            </Card>

            {/* <YourOrder onProceed={handleProceedToCheckout} /> */}
            <YourOrder
              onProceed={handleProceed}
              // disabled={!selectedTable || !date || !time}
            />
          </div>
        </div>
      </div>
    </div>
  )
}