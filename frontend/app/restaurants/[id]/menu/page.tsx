"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { useRouter, useParams } from "next/navigation"
import { MenuContent } from "@/components/menu-content"
import { YourOrder } from "@/components/order-content"
import { Button } from "@/components/ui/button"
import { format, parse } from "date-fns"
import { Reservation, Restaurant, MenuItem } from "@/lib/types"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem,} from "@/components/ui/select"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { getRestaurantById, getMenuByRestaurant } from "@/lib/services/restaurant.service"
import { createReservation } from "@/lib/services/reservation.service"
import Loading from "@/components/loading"
import {
  Clock,
  CalendarDays,
  MapPin,
  Users,
  ArrowLeft,
  Armchair,
} from "lucide-react"

export default function MenuPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const {
    currentReservation,
    setCurrentReservation,
    cart,
    getCartTotal,
    selectedTable,
  } = useAppStore()

  // state
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [servingTime, setServingTime] = useState("")
  const [loading, setLoading] = useState(true)

  // fetch data
  useEffect(() => {
    if (!currentReservation) return

    const init = async () => {
      setLoading(true)

      const [restaurantData, menuData] = await Promise.all([
        getRestaurantById(currentReservation.restaurantId),
        getMenuByRestaurant(currentReservation.restaurantId),
      ])

      setRestaurant(restaurantData ?? null)
      setMenuItems(menuData)
      setLoading(false)
    }

    init()
  }, [currentReservation])

  if (loading) return <Loading />
  if (!restaurant) return null

  if (!currentReservation) {
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

  // helpers
  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const generateServingTimes = () => {
    const [hours, minutes] = currentReservation.time.split(":").map(Number)
    const times: string[] = []

    const closeTime = isWeekend(new Date(currentReservation.date))
      ? restaurant.closing_time_weekend
      : restaurant.closing_time_workday

    const [closeHour, closeMinute] = closeTime.split(":").map(Number)
    const latestMinutes = closeHour * 60 + closeMinute - 30

    for (let i = 0; i <= 8; i++) {
      const totalMinutes = hours * 60 + minutes + i * 15
      if (totalMinutes > latestMinutes) break

      const h = Math.floor(totalMinutes / 60)
      const m = totalMinutes % 60

      times.push(
        `${h.toString().padStart(2, "0")}:${m
          .toString()
          .padStart(2, "0")}`
      )
    }

    return times
  }

  const servingTimes = generateServingTimes()

  // checkout / confirmation
  const handleProceedToCheckout = async () => {
    const finalServingTime = servingTime || currentReservation.time

    const reservationData: Reservation = {
      ...currentReservation,
      preOrders: cart.map(item => ({
        menuItemId: item.id,
        food_name: item.food_name,
        price: item.price,
        quantity: item.quantity,
      })),
      servingTime: cart.length > 0 ? finalServingTime : null,
      totalAmount: getCartTotal(),
    }

    const reservation = await createReservation(reservationData)

    if (reservation.status === "confirmed") {
      router.push(`/confirmation?reservationId=${reservation.id}`)
    } else {
      setCurrentReservation(reservation)
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
            {/* reservation details */}
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
                        currentReservation.date,
                        "yyyy-MM-dd",
                        new Date()
                      ),
                      "EEEE, MMMM d, yyyy"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{currentReservation.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{currentReservation.partySize} guests</span>
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

            {/* serving time */}
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
                    {servingTimes.map(time => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                  Food will be ready at this time to reduce your wait
                </p>
              </CardContent>
            </Card>

            <YourOrder onProceed={handleProceedToCheckout} />
          </div>
        </div>
      </div>
    </div>
  )
}
