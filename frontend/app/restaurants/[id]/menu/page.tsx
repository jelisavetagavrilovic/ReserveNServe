"use client"

import { Suspense, useState } from "react"
import { useAppStore } from "@/lib/store"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { MenuContent } from "@/components/menu-content"
import { YourOrder } from "@/components/order-content"
import { mockRestaurants, mockTables, mockMenuItems } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { format, parse } from "date-fns"
import { Clock, CalendarDays, MapPin, Users, ArrowLeft, Armchair } from "lucide-react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

export default function MenuPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = Number(params.id)

  const restaurant = mockRestaurants.find(r => r.id === id)
  const tableId = Number(searchParams.get("tableId"))
  const reservationDate = searchParams.get("date")
  const reservationTime = searchParams.get("time")
  const partySize = searchParams.get("partySize")
  const table = mockTables[tableId]

  const menuItems = mockMenuItems.filter(item => item.restaurant_id === id)

  const [servingTime, setServingTime] = useState("")

  if (!restaurant || !tableId || !reservationDate || !reservationTime) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Please start a reservation first</h1>
        <Button onClick={() => router.push(`/restaurants/${id}`)}>Go Back</Button>
      </div>
    )
  }

  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const generateServingTimes = () => {
    const [hours, minutes] = reservationTime.split(":").map(Number)
    const times: string[] = []

    const close_time = isWeekend(new Date(reservationDate))
      ? restaurant.closing_time_weekend
      : restaurant.closing_time_workday

    const [closeHour, closeMinute] = close_time.split(":").map(Number)
    const closeTotalMinutes = closeHour * 60 + closeMinute
    const latestAllowedMinutes = closeTotalMinutes - 30

    for (let i = 0; i <= 8; i++) {
      const totalMinutes = hours * 60 + minutes + i * 15
      if (totalMinutes > latestAllowedMinutes) break

      const h = Math.floor(totalMinutes / 60)
      const m = totalMinutes % 60
      times.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`)
    }
    return times
  }

  const servingTimes = generateServingTimes()

  const { cart, addToCart, updateCartItemQuantity, clearCart, getCartTotal } = useAppStore()
  const cartTotal = getCartTotal()

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      }
    >
      <div className="min-h-screen py-6">
        <div className="container mx-auto px-4">
          <div className="mb-6">
           <Button variant="ghost" className="mb-4" onClick={() => router.push(`/restaurants/${id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Restaurant
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Pre-order Your Meal</h1>
            <p className="text-muted-foreground">Select dishes and specify when you want them served</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MenuContent menuItems={menuItems} />
            </div>

            <div className="lg:col-span-1 sticky top-24 space-y-4">
              {/* reservation details */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Reservation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{restaurant.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parse(reservationDate, "yyyy-MM-dd", new Date()), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{reservationTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{partySize} guests</span>
                  </div>
                  {table && (
                    <div className="flex items-center gap-2">
                      <Armchair className="h-4 w-4 text-muted-foreground" />
                      <span>{table.location} ({table.seats} seats)</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* serving time */}
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">When to Serve Food?</CardTitle>
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
                          {time} {time === reservationTime && "(Arrival)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Food will be ready at this time to reduce your wait
                  </p>
                </CardContent>
              </Card>    

              {/* Your Order */}  
              <YourOrder />          
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  )
}
