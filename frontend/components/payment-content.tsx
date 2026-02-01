"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { mockRestaurants } from "@/lib/mock-data"

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  CreditCard,
  Loader2,
  Lock,
  CheckCircle2,
} from "lucide-react"

import type { Reservation } from "@/lib/types"

export function Payment() {
  const router = useRouter()
  const {
    currentReservation,
    updateCurrentReservation,
    addReservation,
  } = useAppStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })

  if (!currentReservation) {
    return (
      <div className="text-center py-16">
        <p>No reservation in progress</p>
        <Button onClick={() => router.push("/")}>Go Home</Button>
      </div>
    )
  }

  const totalAmount = currentReservation.totalAmount ?? 0

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target

    if (name === "number") {
      value = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim()
      if (value.length > 19) return
    }

    if (name === "expiry") {
      value = value.replace(/\D/g, "")
      if (value.length >= 2) {
        value = value.slice(0, 2) + "/" + value.slice(2, 4)
      }
      if (value.length > 5) return
    }

    if (name === "cvc") {
      value = value.replace(/\D/g, "")
      if (value.length > 4) return
    }

    setCardDetails(prev => ({ ...prev, [name]: value }))
  }

  // todo: integrate with real payment gateway
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) return

    setIsProcessing(true)

    try {
      // todo: replace with real API call, we should get back a reservation ID and status for confirmed reservation
      const response = await new Promise<Reservation>((resolve) =>
        setTimeout(() => {
          resolve({
            ...currentReservation,
            id: Math.floor(Math.random() * 1000000), 
            status: "confirmed",
          } as Reservation)
        }, 2000)
      )

      // update store
      updateCurrentReservation(response)

      // todo: delete when we have a backend
      addReservation(response)

      router.push(`/confirmation?reservationId=${response.id}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="lg:sticky lg:top-24 space-y-6 h-fit">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Details</CardTitle>
          <CardDescription>
            Enter your card details to confirm your reservation
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Credit / Debit Card
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">Name on Card</Label>
                    <Input
                      id="cardName"
                      name="name"
                      placeholder="John Doe"
                      className="placeholder:text-muted-foreground/60"
                      value={cardDetails.name}
                      onChange={handleCardChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="cardNumber"
                        name="number"
                        placeholder="1234 5678 9012 3456"
                        className="pl-10 placeholder:text-muted-foreground/60"
                        value={cardDetails.number}
                        onChange={handleCardChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        name="expiry"
                        placeholder="MM/YY"
                        className="placeholder:text-muted-foreground/60"
                        value={cardDetails.expiry}
                        onChange={handleCardChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <div className="relative">
                        <Input
                          id="cvc"
                          name="cvc"
                          placeholder="123"
                          className="placeholder:text-muted-foreground/60"
                          value={cardDetails.cvc}
                          onChange={handleCardChange}
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" size="lg" className="w-full" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : totalAmount > 0 ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay ${totalAmount.toFixed(2)} & Confirm
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Reservation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
