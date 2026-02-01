"use client"

import { useAppStore } from "@/lib/store"
import { useEffect } from "react"
import { ReservationSummary } from "@/components/reservation-summary"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Download, Home, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Loading from "./loading"
import { useSearchParams } from "next/navigation"

export function ConfirmationContent() {
  const searchParams = useSearchParams()
  const reservationId = Number(searchParams.get("reservationId"))
  
  const {
    reservations,
    clearCart,
    setSelectedTable,
    setCurrentReservation,
  } = useAppStore()

  // fake user data
  const user = {
    id: 1,
    name: "John",
    surname: "Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
  }
  
  useEffect(() => {
    clearCart()
    setSelectedTable(null)
    setCurrentReservation(null)
  }, [clearCart, setSelectedTable])

  // todo: fetch reservation detail from api
  const reservation = reservations.find((r) => r.id === reservationId)
  if (!reservation) {
    return Loading();
  }


  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h2 className="text-3xl font-bold mb-2">
            Reservation Confirmed!
          </h2>
          <p className="text-muted-foreground">
            Thank you for your booking! Here are your details:
          </p>
        </div>

        <ReservationSummary
          reservation={reservation}
          mode="confirmation"
        />

        <Card className="bg-muted/50 mb-6 mt-6 flex">
          <CardContent className="pt-1 pb-1">
            <div className="flex items-start gap-2.5">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Check Your Email</p>
                <p className="text-muted-foreground">
                  We&apos;ve sent a confirmation email to {user.email}
                  with all the details.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/bookings" className="flex-1">
            <Button
              variant="outline"
              className="w-full gap-2 bg-transparent"
            >
              <Download className="h-4 w-4" />
              View My Bookings
            </Button>
          </Link>
          <Link href="/" className="flex-1">
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}