"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { useAppStore } from "@/lib/store"
import { ReservationSummary } from "@/components/reservation-summary"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { CheckCircle, Download, Home, Mail } from "lucide-react"
import { useAuth } from "@/auth/hooks/useAuth"
import Loading from "./loading"

export function ConfirmationContent() {
  const router = useRouter()
  const { user } = useAuth()

  const {
    currentReservationResponse: reservation,
    clearCart,
    setSelectedTable,
    setCurrentReservationRequest,
    setCurrentReservationResponse,
  } = useAppStore()

  const handleFinish = () => {
    clearCart()
    setSelectedTable(null)
    setCurrentReservationRequest(null)
    setCurrentReservationResponse(null)
  }

  useEffect(() => {
    window.history.pushState(null, "", window.location.href)

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href)
      router.replace("/")
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [router])

  if (!reservation || !user) return <Loading />

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

        {/* <Card className="bg-muted/50 mb-6 mt-6">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2.5">
              <Mail className="h-5 w-5 text-primary mt-0.5" />

              <div className="text-sm">
                {reservation.emailStatus === "Sent" && (
                  <>
                    <p className="font-medium">Check Your Email</p>
                    <p className="text-muted-foreground">
                      We&apos;ve sent a confirmation email to {user.email}
                    </p>
                  </>
                )}

                {reservation.emailStatus === "Pending" && (
                  <>
                    <p className="font-medium">Sending Confirmation...</p>
                    <p className="text-muted-foreground">
                      Your confirmation email is being prepared.
                    </p>
                  </>
                )}

                {reservation.emailStatus === "Failed" && (
                  <>
                    <p className="font-medium">Email Not Sent</p>
                    <p className="text-muted-foreground">
                      Your reservation is confirmed, but the email could not be delivered.
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card> */}

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/bookings" className="flex-1">
            <Button
              variant="outline"
              className="w-full gap-2 bg-transparent"
              onClick={handleFinish}
            >
              <Download className="h-4 w-4" />
              View My Bookings
            </Button>
          </Link>

          <Link href="/" className="flex-1">
            <Button 
              className="w-full gap-2"
              onClick={handleFinish}
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}