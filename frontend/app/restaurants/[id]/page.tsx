"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"

import { useAppStore } from "@/lib/store"
import { useAuth } from "@/auth/hooks/useAuth"
import { saveRedirectUrl } from "@/auth/store/redirect.store"

import { PageContainer } from "@/components/page-container"
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

import {
  createReservation,
} from "@/lib/services/reservation.service"

import {
  cn,
  getImageSrc,
} from "@/lib/utils"

import type {
  MenuItem,
  Restaurant,
  Table,
} from "@/lib/types/restaurant.types"

import type {
  ReservationRequest,
} from "@/lib/types/reservation.types"

import {
  CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Star,
  Users,
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


  const { isAuthenticated } =
    useAuth()


  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null)

  const [tables, setTables] =
    useState<Table[]>([])

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([])

  const [timeSlots, setTimeSlots] =
    useState<string[]>([])

  const [loading, setLoading] =
    useState(true)


  const [date, setDate] =
    useState<Date | undefined>(
      currentReservationRequest?.date
        ? new Date(
            currentReservationRequest.date
          )
        : new Date()
    )


  const [time, setTime] =
    useState(
      currentReservationRequest?.startTime ??
        ""
    )


  const [partySize, setPartySize] =
    useState<number>(
      currentReservationRequest?.guestNumber ??
        2
    )


  /*
   * Initial restaurant data.
   *
   * Tables are NOT loaded here anymore because
   * table availability depends on:
   *
   * restaurant + date + time + guest number.
   */
  useEffect(() => {
    let isActive = true

    const init = async () => {
      setLoading(true)

      try {
        const [
          restaurantData,
          menuData,
        ] = await Promise.all([
          getRestaurantById(id),
          getMenuByRestaurant(id),
        ])

        if (!isActive) return

        setRestaurant(
          restaurantData?.restaurant ??
            null
        )

        setMenuItems(
          menuData.items
        )
      } catch (error) {
        console.error(
          "Failed to load restaurant:",
          error
        )

        if (isActive) {
          setRestaurant(null)
          setMenuItems([])
        }
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


  /*
   * Load available reservation slots whenever
   * date or party size changes.
   *
   * Backend already removes:
   * - past times for today
   * - times without a suitable free table
   *
   * If the currently selected time is still
   * available, keep it.
   *
   * Otherwise automatically select the first
   * available time.
   */
  useEffect(() => {
    if (!date) {
      setTimeSlots([])
      setTime("")
      setTables([])
      setSelectedTable(null)

      return
    }

    let isActive = true

    const fetchSlots = async () => {
      try {
        const data =
          await getAvailableSlots({
            restaurantId: id,

            date: format(
              date,
              "yyyy-MM-dd"
            ),

            guestNumber:
              partySize,
          })

        if (!isActive) return

        setTimeSlots(
          data.slots
        )

        if (
          data.slots.length === 0
        ) {
          setTime("")
          setTables([])
          setSelectedTable(null)

          return
        }

        setTime(
          (previousTime) => {
            if (
              previousTime &&
              data.slots.includes(
                previousTime
              )
            ) {
              return previousTime
            }

            return data.slots[0]
          }
        )
      } catch (error) {
        console.error(
          "Failed to load available slots:",
          error
        )

        if (isActive) {
          setTimeSlots([])
          setTime("")
          setTables([])
          setSelectedTable(null)
        }
      }
    }

    void fetchSlots()

    return () => {
      isActive = false
    }
  }, [
    id,
    date,
    partySize,
    setSelectedTable,
  ])


  /*
   * Load table availability whenever:
   *
   * - restaurant changes
   * - date changes
   * - time changes
   * - guest number changes
   *
   * This is triggered automatically after
   * the slots effect selects the first
   * available time.
   */
  useEffect(() => {
    if (!date || !time) {
      setTables([])
      return
    }

    let isActive = true

    const fetchTables = async () => {
      try {
        const data =
          await getTablesByRestaurant({
            restaurantId: id,

            date: format(
              date,
              "yyyy-MM-dd"
            ),

            time,

            guestNumber:
              partySize,
          })

        if (!isActive) return

        setTables(
          data.tables
        )
      } catch (error) {
        console.error(
          "Failed to load available tables:",
          error
        )

        if (isActive) {
          setTables([])
          setSelectedTable(null)
        }
      }
    }

    void fetchTables()

    return () => {
      isActive = false
    }
  }, [
    id,
    date,
    time,
    partySize,
    setSelectedTable,
  ])


  /*
   * If availability changes, make sure that
   * the previously selected table is still
   * valid.
   *
   * A table becomes invalid when:
   *
   * - it no longer exists in the response
   * - there are no free tables
   * - it does not have enough seats
   */
  useEffect(() => {
    if (!selectedTable) {
      return
    }

    const refreshedTable =
      tables.find(
        (table) =>
          table.id ===
          selectedTable.id
      )

    if (!refreshedTable) {
      if (tables.length > 0) {
        setSelectedTable(null)
      }

      return
    }

    if (
      refreshedTable.availableNumber <= 0 ||
      refreshedTable.seats <
        partySize
    ) {
      setSelectedTable(null)
    }
  }, [
    tables,
    partySize,
    selectedTable,
    setSelectedTable,
  ])


  const handleDateChange = (
    selected: Date | undefined
  ) => {
    setDate(selected)

    /*
     * Availability from the previous date
     * must not remain visible while the new
     * request is loading.
     */
    setTables([])
    setSelectedTable(null)
  }


  const handleTimeChange = (
    value: string
  ) => {
    setTime(value)

    /*
     * Table availability belongs to the old
     * time until the new request finishes.
     */
    setTables([])
    setSelectedTable(null)
  }


  const maxSeats =
    tables.length > 0
      ? Math.max(
          ...tables.map(
            (table) =>
              table.seats
          )
        )
      : 10


  const handleTableSelect = (
    table: Table
  ) => {
    /*
     * Extra frontend protection.
     * TableLayout should also visually
     * disable these tables.
     */
    if (
      table.availableNumber <= 0 ||
      table.seats < partySize
    ) {
      return
    }

    if (
      selectedTable?.id ===
      table.id
    ) {
      setSelectedTable(null)
    } else {
      setSelectedTable(table)
    }
  }


  const buildReservationRequest =
    (): ReservationRequest | null => {
      if (
        !restaurant ||
        !selectedTable ||
        !date ||
        !time
      ) {
        return null
      }

      return {
        restaurantId:
          restaurant.id,

        tableGroupId:
          selectedTable.id,

        date: format(
          date,
          "yyyy-MM-dd"
        ),

        startTime:
          time,

        guestNumber:
          partySize,

        orders:
          currentReservationRequest
            ?.orders ?? [],

        servingTime:
          currentReservationRequest
            ?.servingTime,
      }
    }


  /*
   * Keep the reservation request in the
   * application store while the user moves
   * between reservation and menu pages.
   */
  useEffect(() => {
    const request =
      buildReservationRequest()

    if (request) {
      setCurrentReservationRequest(
        request
      )
    }
  }, [
    date,
    time,
    partySize,
    selectedTable,
  ])


  const handleBookWithoutPreorder =
    async () => {
      if (!isAuthenticated) {
        saveRedirectUrl()
        router.push("/login")
        return
      }

      const request =
        buildReservationRequest()

      if (!request) return

      try {
        const reservation =
          await createReservation(
            request
          )

        setCurrentReservationResponse(
          reservation
        )

        if (
          reservation.status ===
          "Confirmed"
        ) {
          router.push(
            `/confirmation?reservationId=${reservation.id}`
          )
        }
      } catch (error) {
        console.error(
          "Failed to create reservation:",
          error
        )
      }
    }


  const handleProceedToMenu = () => {
    if (!isAuthenticated) {
      saveRedirectUrl()
      router.push("/login")
      return
    }

    const request =
      buildReservationRequest()

    if (!request) return

    setCurrentReservationRequest(
      request
    )

    router.push(
      `/restaurants/${id}/menu`
    )
  }


  if (loading) {
    return <Loading />
  }


  if (!restaurant) {
    return (
      <PageContainer className="max-w-xl">
        <div className="py-16 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Restaurant not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            The restaurant you're looking
            for is not available.
          </p>

          <Button
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


  return (
    <>
      {/* Hero */}
      <div className="relative h-[300px] md:h-[380px]">
        <Image
          src={restaurant.image || "/placeholder.svg"}
          alt={restaurant.name}
          fill
          unoptimized
          priority
          className="object-cover"
        />

        {/* Soft transition into page background */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Restaurant info */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto w-full max-w-7xl px-4 pb-3 sm:px-6 lg:px-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {restaurant.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />

                  <span className="font-medium">
                    {restaurant.rating}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />

                  <span>
                    {restaurant.address},{" "}
                    {restaurant.city}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />

                  <span>
                    {
                      restaurant.phoneNumber
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />

                  <span>
                    {
                      restaurant.openingTime
                    }{" "}
                    -{" "}
                    {
                      restaurant.closingTime
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <PageContainer>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* Left */}
          <div className="space-y-6">

            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  About
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm leading-7 text-muted-foreground">
                  {
                    restaurant.description
                  }
                </p>
              </CardContent>
            </Card>


            <Card className="rounded-2xl border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Select Your Table
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  Choose an available table
                  for your party
                </p>
              </CardHeader>

              <CardContent>
                <TableLayout
                  tables={
                    tables
                  }
                  selectedTable={
                    selectedTable
                  }
                  onSelectTable={
                    handleTableSelect
                  }
                  partySize={
                    partySize
                  }
                />
              </CardContent>
            </Card>


            <MenuPreview
              menuItems={
                menuItems
              }
            />
          </div>


          {/* Right */}
          <aside>
            <Card className="sticky top-24 rounded-2xl border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  Make a Reservation
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  Choose your party size,
                  date and time
                </p>
              </CardHeader>


              <CardContent className="space-y-5">

                {/* Party size */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Party Size
                  </label>

                  <Select
                    value={
                      partySize.toString()
                    }
                    onValueChange={(
                      value
                    ) => {
                      const nextPartySize =
                        Number(value)

                      setPartySize(
                        nextPartySize
                      )

                      if (
                        selectedTable &&
                        selectedTable.seats <
                          nextPartySize
                      ) {
                        setSelectedTable(
                          null
                        )
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />

                        <SelectValue />
                      </div>
                    </SelectTrigger>

                    <SelectContent>
                      {Array.from(
                        {
                          length:
                            maxSeats,
                        },
                        (_, index) =>
                          index + 1
                      ).map(
                        (number) => (
                          <SelectItem
                            key={
                              number
                            }
                            value={
                              number.toString()
                            }
                          >
                            {number}{" "}
                            {number === 1
                              ? "guest"
                              : "guests"}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>


                {/* Date */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Date
                  </label>

                  <Popover>
                    <PopoverTrigger
                      asChild
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "h-11 w-full justify-start rounded-xl px-3 font-normal",

                          !date &&
                            "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />

                        {date
                          ? format(
                              date,
                              "PPP"
                            )
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>


                    <PopoverContent
                      className="w-auto p-0"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          date
                        }
                        onSelect={
                          handleDateChange
                        }
                        disabled={(
                          calendarDate
                        ) => {
                          const today =
                            new Date()

                          today.setHours(
                            0,
                            0,
                            0,
                            0
                          )

                          return (
                            calendarDate <
                            today
                          )
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>


                {/* Time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Time
                  </label>

                  <Select
                    value={
                      time
                    }
                    onValueChange={
                      handleTimeChange
                    }
                    disabled={
                      timeSlots.length ===
                      0
                    }
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />

                        <SelectValue
                          placeholder={
                            timeSlots.length >
                            0
                              ? "Select time"
                              : "No times available"
                          }
                        />
                      </div>
                    </SelectTrigger>

                    <SelectContent>
                      {timeSlots.map(
                        (slot) => (
                          <SelectItem
                            key={
                              slot
                            }
                            value={
                              slot
                            }
                          >
                            {slot}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>


                {/* Selected table */}
                {selectedTable && (
                  <div className="rounded-xl bg-primary/5 p-3.5">
                    <div className="flex items-start gap-3">

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Check className="h-4 w-4 text-primary" />
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground">
                          Selected Table
                        </p>

                        <p className="mt-0.5 text-sm font-semibold capitalize">
                          {
                            selectedTable.location
                          }{" "}
                          ·{" "}
                          {
                            selectedTable.seats
                          }{" "}
                          seats
                        </p>
                      </div>

                    </div>
                  </div>
                )}


                {/* Actions */}
                <div className="space-y-3 pt-1">

                  <Button
                    type="button"
                    size="lg"
                    className="w-full rounded-xl"
                    onClick={
                      handleBookWithoutPreorder
                    }
                    disabled={
                      !date ||
                      !time ||
                      !selectedTable
                    }
                  >
                    Book Table

                    <Check className="ml-2 h-4 w-4" />
                  </Button>


                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full rounded-xl"
                    onClick={
                      handleProceedToMenu
                    }
                    disabled={
                      !date ||
                      !time ||
                      !selectedTable
                    }
                  >
                    <UtensilsCrossed className="mr-2 h-4 w-4" />

                    Pre-order Food

                    <ChevronRight className="ml-auto h-4 w-4" />
                  </Button>

                </div>


                {!selectedTable && (
                  <p className="text-center text-xs text-muted-foreground">
                    Select a table to
                    continue
                  </p>
                )}

              </CardContent>
            </Card>
          </aside>

        </div>
      </PageContainer>
    </>
  )
}