"use client"

import { useState, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { mockRestaurants, mockTables, mockMenuItems } from "@/lib/mock-data"
import { useAppStore } from "@/lib/store"
import { TableLayout } from "@/components/table-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Star,
  MapPin,
  Phone,
  Clock,
  CalendarIcon,
  Users,
  ChevronRight,
  Leaf,
  WheatOff,
  Check,
  UtensilsCrossed,
} from "lucide-react"
import { format, addDays } from "date-fns"
import type { Table } from "@/lib/types"


export default function RestaurantDetailPage() {
  const params = useParams()
  const id = Number(params.id)
  const router = useRouter()
  const { selectedTable, setSelectedTable } = useAppStore()

  const restaurant = mockRestaurants.find((r) => r.id === id)
  const tables = mockTables.filter(
    (table) => table.restaurantId === id
  )
  const menuItems = mockMenuItems.filter(
    (item) => item.restaurant_id === id
  )

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
        <Button onClick={() => router.push("/restaurants")}>Browse Restaurants</Button>
      </div>
    )
  }

  // *** Helper functions to time slots and availability *** //
  const isWeekend = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())


  const timeStringToDate = (date: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  }

  const roundToNextHalfHour = (date: Date) => {
    const minutes = date.getMinutes()

    if (minutes === 0 || minutes === 30) {
      return date
    }

    if (minutes < 30) {
      date.setMinutes(30, 0, 0)
    } else {
      date.setHours(date.getHours() + 1)
      date.setMinutes(0, 0, 0)
    }

    return date
  }

  const generateTimeSlots = (
    selectedDate: Date
  ) => {
    const slots: string[] = []

    // maybe friday or saturday -> weekend hours
    const weekend = isWeekend(selectedDate)

    const openingTime = weekend
      ? restaurant.opening_time_weekend
      : restaurant.opening_time_workday

    const closingTime = weekend
      ? restaurant.closing_time_weekend
      : restaurant.closing_time_workday

    let startTime = timeStringToDate(selectedDate, openingTime)
    const endTime = timeStringToDate(selectedDate, closingTime)

    const now = new Date()
    const isToday =
      selectedDate.toDateString() === now.toDateString()

    if (isToday) {
      const roundedNow = roundToNextHalfHour(now);
      if (roundedNow > startTime) {
        startTime = roundedNow > endTime ? endTime : roundedNow;
      }
    }

    while (startTime < endTime) {
      const h = startTime.getHours().toString().padStart(2, "0")
      const m = startTime.getMinutes().toString().padStart(2, "0")

      slots.push(`${h}:${m}`)

      startTime = new Date(startTime.getTime() + 30 * 60000)
    }

    return slots
  }


  const handleDateChange = (selected: Date | undefined) => {
    setDate(selected)
    const slots = selected ? generateTimeSlots(selected) : []
    // setTime(slots[0] || "")
    if (time && !slots.includes(time)) {
      setTime(slots[0] || "")
    }
  }

  // helper checking if there are available slots for selected date
  const hasAvailableSlots = (selectedDate: Date) => {
    const slots = generateTimeSlots(selectedDate)
    return slots.length > 0
  }

  // ************** //


  const [date, setDate] = useState<Date | undefined>(hasAvailableSlots(new Date()) ? new Date() : addDays(new Date(), 1))
  const [time, setTime] = useState<string>("")
  const [partySize, setPartySize] = useState<number>(2)

  const maxSeats = Math.max(...tables.map((t) => t.seats));

  const timeSlots = useMemo(() => {
    if (!date) return []
    return generateTimeSlots(date)
  }, [date])


  // *** Handler table selection and reservation *** //
  const handleTableSelect = (table: Table) => {
    if (selectedTable?.id === table.id) {
      setSelectedTable(null)
    } else {
      setSelectedTable(table)
    }
  }

  // todo: handle reservation submission - add redirect to login, show toast notification or create reservation
  const handleBookWithoutPreorder = () => {
  }

  const handleProceedToMenu = () => {
    if (!date || !time || !selectedTable) {
      return
    }

    const params = new URLSearchParams({
      tableId: selectedTable.id.toString(),
      date: format(date, "yyyy-MM-dd"),
      time,
      partySize: partySize.toString(),
    })

    router.push(`/restaurants/${id}/menu?${params.toString()}`)
  }

  // ************** //

  return (
    <div className="min-h-screen">
      {/* hero Image */}
      <div className="relative h-[300px] md:h-[400px]">
        <Image src={restaurant.image || "/placeholder.svg"} alt={restaurant.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" /> 
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto space-y-3">
            {/* name & rating */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-1">{restaurant.name}</h1>
            </div>

            {/* rating */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {restaurant.rating}
            </div>

            {/* address */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {restaurant.address}, {restaurant.city}
            </div>

            {/* phone */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              {restaurant.phone_number}
            </div>

            {/* opening hours */}
            <div className="flex flex-col md:flex-row gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Weekdays: {restaurant.opening_time_workday} - {restaurant.closing_time_workday}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Weekend: {restaurant.opening_time_weekend} - {restaurant.closing_time_weekend}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* about */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">{restaurant.description}</p>
              </CardContent>
            </Card>

            {/* table Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Your Table</CardTitle>
              </CardHeader>
              <CardContent>
                <TableLayout
                  tables={tables}
                  selectedTable={selectedTable}
                  onSelectTable={handleTableSelect}
                  partySize={partySize}
                />
              </CardContent>
            </Card>

            {/* menu Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="appetizer">
                  <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="appetizer">Appetizers</TabsTrigger>
                    <TabsTrigger value="main">Mains</TabsTrigger>
                    <TabsTrigger value="dessert">Desserts</TabsTrigger>
                    <TabsTrigger value="drink">Drinks</TabsTrigger>
                  </TabsList>
                  {(["appetizer", "main", "dessert", "drink"] as const).map((category) => (
                    <TabsContent key={category} value={category} className="space-y-4">
                      {menuItems
                        .filter((m) => m.category === category)
                        .slice(0, 3)
                        .map((item) => (
                          <div key={item.id} className="flex gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.food_name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium">{item.food_name}</h4>
                                <span className="font-semibold text-primary">${item.price}</span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* sidebar - Reservation Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Make a Reservation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* party size */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Party Size</label>
                  <Select value={partySize.toString()} onValueChange={(v) => setPartySize(Number.parseInt(v))}>
                    <SelectTrigger>
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {n === 1 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* date */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-transparent">
                        <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        {date ? format(date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleDateChange}
                        disabled={(d) => {
                          if (d < todayStart) return true
                          if (isSameDay(d, todayStart) && !hasAvailableSlots(d)) return true
                          return false
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* time */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Time</label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* selected table */}
                {selectedTable && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Selected Table</p>
                    <p className="font-medium">
                      {selectedTable.seats} seats  • {selectedTable.location}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleBookWithoutPreorder}
                    disabled={!date || !time || !selectedTable}
                  >
                    Book Table
                    <Check className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    size="lg"
                    onClick={handleProceedToMenu}
                    disabled={!date || !time || !selectedTable}
                  >
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Pre-order Food
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Pre-order is optional
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
  

