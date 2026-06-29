"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Plus } from "lucide-react"
import { useAuth } from "@/auth/hooks/useAuth"
import { getReservationsForUser, cancelReservation } from "@/lib/services/reservation.service"
import { refundPayment } from "@/lib/services/payment.service"
import { ReservationResponse } from "@/lib/types/reservation.types"
import { parse, isPast } from "date-fns"
import { BookingCard } from "@/components/booking-card"

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{subtitle}</p>
        <Link href="/restaurants">
          <Button>Browse Restaurants</Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function BookingsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [reservations, setReservations] = useState<ReservationResponse[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (!user) return

    const init = async () => {
      setLoading(true)
      const data = await getReservationsForUser()
      setReservations(data || [])
      setLoading(false)
    }

    void init()
  }, [isAuthenticated, router, user])

  if (!isAuthenticated) {
    return null
  }

  if (loading || reservations === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your reservations...</p>
      </div>
    )
  }

  const upcomingBookings = reservations.filter((r) => {
    const reservationDateTime = parse(`${r.date} ${r.startTime}`, "yyyy-MM-dd HH:mm", new Date())
    return !isPast(reservationDateTime) && r.status !== "Cancelled"
  })

  const pastBookings = reservations.filter((r) => {
    const reservationDateTime = parse(`${r.date} ${r.startTime}`, "yyyy-MM-dd HH:mm", new Date())
    return isPast(reservationDateTime) && r.status !== "Cancelled"
  })

  const handleCancelReservation = async (
    reservation: ReservationResponse
  ) => {
    try {
      const isPaidReservation =
        reservation.status === "Confirmed" &&
        reservation.totalAmount > 0

      if (isPaidReservation) {
        await refundPayment(reservation.id)
      } else {
        await cancelReservation(reservation.id)
      }

      setReservations((prev) =>
        prev?.filter((r) => r.id !== reservation.id) ?? []
      )
    } catch (error) {
      console.error("Failed to cancel reservation:", error)
    }
  }

  return (
    <div className="min-h-screen py-6">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-muted-foreground">View and manage your restaurant reservations</p>
          </div>
          <Link href="/restaurants">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Booking
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingBookings.length > 0 ? (
              upcomingBookings.map((reservation) => (
                <BookingCard
                  key={reservation.id}
                  reservation={reservation}
                  showActions
                  onCancel={() =>
                    handleCancelReservation(reservation)
                  }
                />
              ))
            ) : (
              <EmptyState
                title="No Upcoming Reservations"
                subtitle="Ready to book your next table?"
              />
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastBookings.length > 0
              ? pastBookings.map((r) => 
                <BookingCard key={r.id} reservation={r} />)
              : <EmptyState title="No Past Reservations" subtitle="Your completed bookings will appear here" />}
          </TabsContent> 
        </Tabs>
      </div>
    </div>
  )
}

