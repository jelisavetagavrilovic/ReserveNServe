"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"

import { useAppStore } from "@/lib/store"
import { useAuth } from "@/auth/hooks/useAuth"
import { saveRedirectUrl } from "@/auth/store/redirect.store"

import { TableLayout } from "@/components/table-layout"
import { MenuPreview } from "@/components/menu-preview"
import Loading from "@/components/loading"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  getRestaurantById,
  getTablesByRestaurant,
  getMenuByRestaurant,
  getAvailableSlots,
} from "@/lib/services/restaurant.service"

import { createReservation } from "@/lib/services/reservation.service"
import { getImageSrc } from "@/lib/utils"

import type {
  Restaurant,
  Table,
  MenuItem,
} from "@/lib/types/restaurant.types"

import type {
  ReservationRequest,
} from "@/lib/types/reservation.types"

import {
  Star,
  MapPin,
  Phone,
  Clock,
  CalendarIcon,
  Users,
  ChevronRight,
  Check,
  UtensilsCrossed,
} from "lucide-react"

export default function RestaurantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const {
    selectedTable,
    setSelectedTable,
    currentReservationRequest,
    setCurrentReservationRequest,
    setCurrentReservationResponse,
  } = useAppStore()

  const { isAuthenticated } = useAuth()

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // restore previous state if user returns
  const [date, setDate] = useState<Date | undefined>(
    currentReservationRequest?.date
      ? new Date(currentReservationRequest.date)
      : new Date()
  )

  const [time, setTime] = useState(
    currentReservationRequest?.startTime ?? ""
  )

  const [partySize, setPartySize] = useState<number>(
    currentReservationRequest?.guestNumber ?? 2
  )

  // fetch restaurant data
  useEffect(() => {
    let isActive = true

    const init = async () => {
      setLoading(true)

      try {
        const [restaurantData, tablesData, menuData] =
          await Promise.all([
            getRestaurantById(id),
            getTablesByRestaurant(id),
            getMenuByRestaurant(id),
          ])

        if (!isActive) return

        setRestaurant(restaurantData?.restaurant ?? null)
        setTables(tablesData.tables)
        setMenuItems(menuData.items)
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    void init()

    return () => {
      isActive = false
    }
  }, [id])

  // fetch available reservation slots
  useEffect(() => {
    if (!date) return

    const fetchSlots = async () => {
      const data = await getAvailableSlots({
        restaurantId: id,
        date: format(date, "yyyy-MM-dd"),
      })

      setTimeSlots(data.slots)

      // keep old selected time if still valid
      if (
        currentReservationRequest?.startTime &&
        data.slots.includes(currentReservationRequest.startTime)
      ) {
        setTime(currentReservationRequest.startTime)
      } else if (data.slots.length > 0) {
        setTime(data.slots[0])
      } else {
        setTime("")
      }
    }

    void fetchSlots()
  }, [date, id, currentReservationRequest])

  const handleDateChange = (selected: Date | undefined) => {
    setDate(selected)
  }

  const maxSeats =
    tables.length > 0
      ? Math.max(...tables.map((t) => t.seats))
      : 10

  const handleTableSelect = (table: Table) => {
    if (selectedTable?.id === table.id) {
      setSelectedTable(null)
    } else {
      setSelectedTable(table)
    }
  }

  const buildReservationRequest =
    (): ReservationRequest | null => {
      if (!restaurant || !selectedTable || !date || !time)
        return null

      return {
        restaurantId: restaurant.id,
        tableGroupId: selectedTable.id,
        date: format(date, "yyyy-MM-dd"),
        startTime: time,
        guestNumber: partySize,
        orders: currentReservationRequest?.orders ?? [],
        servingTime:
          currentReservationRequest?.servingTime,
      }
    }

  // persist changes while user edits
  useEffect(() => {
    const request = buildReservationRequest()

    if (request) {
      setCurrentReservationRequest(request)
    }
  }, [date, time, partySize, selectedTable])

  const handleBookWithoutPreorder = async () => {
    if (!isAuthenticated) {
      saveRedirectUrl()
      router.push("/login")
      return
    }

    const request = buildReservationRequest()
    if (!request) return

    try {
      const reservation =
        await createReservation(request)

      setCurrentReservationResponse(reservation)

      if (reservation.status === "Confirmed") {
        router.push(
          `/confirmation?reservationId=${reservation.id}`
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleProceedToMenu = () => {
    if (!isAuthenticated) {
      saveRedirectUrl()
      router.push("/login")
      return
    }
    
    const request = buildReservationRequest()
    if (!request) return

    setCurrentReservationRequest(request)

    router.push(`/restaurants/${id}/menu`)
  }

  if (loading) return <Loading />

  if (!restaurant) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Restaurant not found
        </h1>

        <Button onClick={() => router.push("/restaurants")}>
          Browse Restaurants
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* hero */}
      <div className="relative h-[300px] md:h-[400px]">
        <Image
          src={getImageSrc(restaurant.image)}
          alt={restaurant.name}
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold">
              {restaurant.name}
            </h1>

            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {restaurant.rating}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4" />
              {restaurant.address}, {restaurant.city}
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4" />
              {restaurant.phone_number}
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* left */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{restaurant.description}</p>
              </CardContent>
            </Card>

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

            <MenuPreview menuItems={menuItems} />
          </div>


          {/* right */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Make a Reservation</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* guests */}
                <Select
                  value={partySize.toString()}
                  onValueChange={(v) => {
                    const nextPartySize = Number(v)

                    setPartySize(nextPartySize)

                    // reset selected table if it no longer fits
                    if (
                      selectedTable &&
                      selectedTable.seats < nextPartySize
                    ) {
                      setSelectedTable(null)
                    }
                  }}
                >
                  <SelectTrigger>
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {Array.from(
                      { length: maxSeats },
                      (_, i) => i + 1
                    ).map((n) => (
                      <SelectItem
                        key={n}
                        value={n.toString()}
                      >
                        {n} guests
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {date ? format(date, "PPP") : "Pick date"}
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={handleDateChange}
                      disabled={(date) => {
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)

                        return date < today
                      }}
                    />
                  </PopoverContent>
                </Popover>

                {/* time */}
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger>
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* selected table */}
                {selectedTable && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Selected Table
                    </p>
                    <p>
                      {selectedTable.seats} seats •{" "}
                      {selectedTable.location}
                    </p>
                  </div>
                )}

                {/* actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    onClick={handleBookWithoutPreorder}
                    disabled={!date || !time || !selectedTable}
                  >
                    Book Table
                    <Check className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleProceedToMenu}
                    disabled={!date || !time || !selectedTable}
                  >
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Pre-order Food
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}