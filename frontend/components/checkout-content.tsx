"use client"

import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

import { Payment } from "@/components/payment-content"
import { ReservationSummary } from "@/components/reservation-summary" 
import Loading from "./loading"
import { useEffect, useState } from "react"

export function CheckoutContent() {
  const router = useRouter();
  const { currentReservation } = useAppStore();
  const [hydrated, setHydrated] = useState(false)
 
  // refresh
  useEffect(() => {
    setHydrated(true)
  }, [])
  useEffect(() => {
    if (hydrated && !currentReservation) {
      router.replace("/")
    }
  }, [hydrated, currentReservation, router])

  if (!hydrated || !currentReservation) {
    return <Loading />
  }

  const backToMenuUrl =
    `/restaurants/${currentReservation.restaurantId}/menu` +
    `?tableId=${currentReservation.tableId}&date=${currentReservation.date}` + 
    `&time=${currentReservation.time}&partySize=${currentReservation.partySize}`

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-5xl">

        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push(backToMenuUrl)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Menu
        </Button>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground">
          Review your reservation and complete the payment
        </p>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          <ReservationSummary 
            reservation={currentReservation} 
            mode="checkout" 
          />
          <Payment />
        </div>

      </div>
    </div>
  )
}
