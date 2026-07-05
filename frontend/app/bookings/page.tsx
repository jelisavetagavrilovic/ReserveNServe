"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
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

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming")
  const [upcomingPage, setUpcomingPage] = useState(1)
  const [pastPage, setPastPage] = useState(1)
  const [upcomingTotalPages, setUpcomingTotalPages] = useState(1)
  const [pastTotalPages, setPastTotalPages] = useState(1)

  const loadReservations = async () => {
    setLoading(true)

    const page =
      activeTab === "upcoming"
        ? upcomingPage
        : pastPage

    const response =
      await getReservationsForUser({
        page,
        pageSize: 5,
        type: activeTab,
      })

    setReservations(response.items)

    if (activeTab === "upcoming") {
      setUpcomingTotalPages(response.totalPages)
    } else {
      setPastTotalPages(response.totalPages)
    }

    setLoading(false)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (!user) return

    void loadReservations()
  }, [
    isAuthenticated,
    user,
    activeTab,
    upcomingPage,
    pastPage,
  ])

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

  const currentPage =
    activeTab === "upcoming"
      ? upcomingPage
      : pastPage

  const currentTotalPages =
    activeTab === "upcoming"
      ? upcomingTotalPages
      : pastTotalPages

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

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "upcoming" | "past")
          }
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
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
              {reservations.length > 0 ? (
                reservations.map((reservation) => (
                  <BookingCard
                    key={reservation.id}
                    reservation={reservation}
                  />
                ))
              ) : (
                <EmptyState
                  title="No Past Reservations"
                  subtitle="Your completed bookings will appear here"
                />
              )}
          </TabsContent> 
        </Tabs>

        {currentTotalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() =>
                activeTab === "upcoming"
                  ? setUpcomingPage((prev) => prev - 1)
                  : setPastPage((prev) => prev - 1)
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm font-medium">
              {currentPage} / {currentTotalPages}
            </span>

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === currentTotalPages}
              onClick={() =>
                activeTab === "upcoming"
                  ? setUpcomingPage((prev) => prev + 1)
                  : setPastPage((prev) => prev + 1)
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

