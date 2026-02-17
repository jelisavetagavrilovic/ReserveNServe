"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

import { useAppStore } from "@/lib/store"
import { getReservationById } from "@/lib/services/reservation.service"
import { Reservation } from "@/lib/types"

import { ReservationSummary } from "@/components/reservation-summary"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Loading from "./loading"

import { CheckCircle, Download, Home, Mail } from "lucide-react"


export function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reservationIdParam = searchParams.get("reservationId")

  const {
    user,
    clearCart,
    setSelectedTable,
    setCurrentReservation,
  } = useAppStore()

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)

  // fetch reservation
  useEffect(() => {
    if (!reservationIdParam) return

    const reservationId = Number(reservationIdParam)
    if (Number.isNaN(reservationId)) return

    const init = async () => {
      setLoading(true)
      const data = await getReservationById(reservationId)
      setReservation(data ?? null)
      setLoading(false)

      // cleanup after successful confirmation load
      clearCart()
      setSelectedTable(null)
      setCurrentReservation(null)
    }

    init()
  }, [reservationIdParam, clearCart, setSelectedTable, setCurrentReservation])

  // todo: block back button
   // block back button after loading
  // useEffect(() => {
  // if (loading || !reservation) return

  // const handlePopState = () => {
  //   router.replace("/")
  // }

  // window.addEventListener("popstate", handlePopState)
  // return () => window.removeEventListener("popstate", handlePopState)
  // }, [loading, reservation, router])

  useEffect(() => {
    // window.history.pushState(reservationIdParam, "", '/confirmation?reservationId=')
    window.history.replaceState(null, "", `/confirmation?reservationId=${reservationIdParam}`)

    const handlePopState = () => {
      router.replace("/") 
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [router])
  // -----


  if (loading || !user) return <Loading />
  if (!reservation) return null

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

        <Card className="bg-muted/50 mb-6 mt-6">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2.5">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Check Your Email</p>
                <p className="text-muted-foreground">
                  We&apos;ve sent a confirmation email to {user.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/bookings" className="flex-1">
            <Button variant="outline" className="w-full gap-2 bg-transparent">
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
