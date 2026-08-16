"use client"

import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

import { Payment } from "@/components/payment-content"
import { ReservationSummary } from "@/components/reservation-summary" 
import Loading from "./loading"


export function CheckoutContent() {
  const router = useRouter()

  const { currentReservationRequest, currentReservationResponse } = useAppStore()

  if (!currentReservationRequest || !currentReservationResponse) {
    return <Loading />
  }

  const backToMenuUrl =`/restaurants/${currentReservationRequest.restaurantId}/menu`

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
            reservation={currentReservationResponse} 
            mode="checkout" 
          />
          <Payment />
        </div>

      </div>
    </div>
  )
}
