"use client"

import {
  useCallback,
  useEffect,
  useState,
} from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/auth/hooks/useAuth"

import { BookingCard } from "@/components/booking-card"
import Loading from "@/components/loading"
import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
} from "@/components/ui/card"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react"

import {
  cancelReservation,
  getReservationsForUser,
} from "@/lib/services/reservation.service"

import type {
  ReservationResponse,
} from "@/lib/types/reservation.types"

type BookingTab =
  | "upcoming"
  | "past"

interface EmptyStateProps {
  title: string
  subtitle: string
}

function EmptyState({
  title,
  subtitle,
}: EmptyStateProps) {
  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardContent className="py-10 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </div>

        <h3 className="mt-3 text-lg font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle}
        </p>

        <Link href="/restaurants">
          <Button className="mt-5 rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default function BookingsPage() {
  const router = useRouter()

  const {
    user,
    isAuthenticated,
  } = useAuth()

  const [reservations, setReservations] =
    useState<ReservationResponse[] | null>(
      null
    )

  const [loading, setLoading] =
    useState(true)

  const [activeTab, setActiveTab] =
    useState<BookingTab>(
      "upcoming"
    )

  const [upcomingPage, setUpcomingPage] =
    useState(1)

  const [pastPage, setPastPage] =
    useState(1)

  const [
    upcomingTotalPages,
    setUpcomingTotalPages,
  ] = useState(1)

  const [
    pastTotalPages,
    setPastTotalPages,
  ] = useState(1)

  const loadReservations =
    useCallback(async () => {
      setLoading(true)

      try {
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

        setReservations(
          response.items
        )

        if (
          activeTab === "upcoming"
        ) {
          setUpcomingTotalPages(
            response.totalPages
          )
        } else {
          setPastTotalPages(
            response.totalPages
          )
        }
      } catch (error) {
        console.error(
          "Failed to load reservations:",
          error
        )

        setReservations([])
      } finally {
        setLoading(false)
      }
    }, [
      activeTab,
      upcomingPage,
      pastPage,
    ])

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
    router,
    loadReservations,
  ])

  const handleCancelReservation =
    async (
      reservation:
        ReservationResponse
    ) => {
      try {
        await cancelReservation(
          reservation.id
        )

        setReservations(
          (previous) =>
            previous?.filter(
              (item) =>
                item.id !==
                reservation.id
            ) ?? []
        )
      } catch (error) {
        console.error(
          "Failed to cancel reservation:",
          error
        )
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

  const handlePreviousPage = () => {
    if (
      activeTab === "upcoming"
    ) {
      setUpcomingPage(
        (previous) =>
          Math.max(
            1,
            previous - 1
          )
      )

      return
    }

    setPastPage(
      (previous) =>
        Math.max(
          1,
          previous - 1
        )
    )
  }

  const handleNextPage = () => {
    if (
      activeTab === "upcoming"
    ) {
      setUpcomingPage(
        (previous) =>
          Math.min(
            upcomingTotalPages,
            previous + 1
          )
      )

      return
    }

    setPastPage(
      (previous) =>
        Math.min(
          pastTotalPages,
          previous + 1
        )
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (
    loading ||
    reservations === null
  ) {
    return <Loading />
  }

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="My Bookings"
          description="View and manage your restaurant reservations"
          action={
            <Link href="/restaurants">
              <Button className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                New Booking
              </Button>
            </Link>
          }
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(
              value as BookingTab
            )
          }
          className="space-y-4"
        >
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-muted/60 p-1 sm:w-[320px]">
            <TabsTrigger
              value="upcoming"
              className="rounded-lg"
            >
              Upcoming
            </TabsTrigger>

            <TabsTrigger
              value="past"
              className="rounded-lg"
            >
              Past Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="upcoming"
            className="mt-0 space-y-4"
          >
            {reservations.length >
            0 ? (
              reservations.map(
                (reservation) => (
                  <BookingCard
                    key={
                      reservation.id
                    }
                    reservation={
                      reservation
                    }
                    showActions
                    onCancel={() =>
                      handleCancelReservation(
                        reservation
                      )
                    }
                  />
                )
              )
            ) : (
              <EmptyState
                title="No Upcoming Reservations"
                subtitle="Ready to book your next table?"
              />
            )}
          </TabsContent>

          <TabsContent
            value="past"
            className="mt-0 space-y-4"
          >
            {reservations.length >
            0 ? (
              reservations.map(
                (reservation) => (
                  <BookingCard
                    key={
                      reservation.id
                    }
                    reservation={
                      reservation
                    }
                  />
                )
              )
            ) : (
              <EmptyState
                title="No Past Reservations"
                subtitle="Your completed bookings will appear here."
              />
            )}
          </TabsContent>
        </Tabs>

        {currentTotalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              disabled={
                currentPage === 1
              }
              onClick={
                handlePreviousPage
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground">
              Page{" "}
              <span className="font-medium text-foreground">
                {currentPage}
              </span>{" "}
              of {currentTotalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-xl"
              disabled={
                currentPage ===
                currentTotalPages
              }
              onClick={
                handleNextPage
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}