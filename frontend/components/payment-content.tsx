"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useAppStore } from "@/lib/store"

import {
  createPaymentIntent,
  confirmPayment,
} from "@/lib/services/payment.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

import {
  CreditCard,
  Loader2,
  Lock,
  CheckCircle2,
} from "lucide-react"

import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"

export function Payment() {
  const router = useRouter()
  const stripe = useStripe()
  const elements = useElements()

  const {
    currentReservationResponse,
    updateCurrentReservationResponse,
  } = useAppStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [cardholderName, setCardholderName] = useState("")

  if (!currentReservationResponse) {
    return (
      <div className="text-center py-16">
        <p>No reservation in progress</p>

        <Button onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    )
  }

  const totalAmount = currentReservationResponse.totalAmount ?? 0

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage("Stripe is not ready yet.")
      return
    }

    if (!cardholderName.trim()) {
      setErrorMessage("Please enter cardholder name.")
      return
    }

    setIsProcessing(true)
    setErrorMessage("")

    try {
      // create payment intent
      const clientSecret = 
        await createPaymentIntent(
          currentReservationResponse.id
        )

      // get card element
      const cardElement = 
        elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error("Card element not found")
      }

      // confirm payment with Stripe
      const result =
        await stripe.confirmCardPayment(
          clientSecret.clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: cardholderName,
              },
            },
          }
        )
      if (result.error) {
        setErrorMessage(
          result.error.message ??
            "Payment failed."
        )
        return
      }      

      // update reservation after success
      if (
        result.paymentIntent?.status ===
        "succeeded"
      ) {
        const updatedReservation =
          await confirmPayment(
            currentReservationResponse.id,
            result.paymentIntent.id
          )

        if (!updatedReservation) {
          throw new Error(
            "Reservation not found"
          )
        }

        updateCurrentReservationResponse(
          updatedReservation
        )

        router.push(
          `/confirmation?reservationId=${updatedReservation.id}`
        )
      }
    } catch (error) {
      console.error(error)

      setErrorMessage(
        "Payment failed. Please try again."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="lg:sticky lg:top-24 h-fit">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Payment Details
          </CardTitle>

          <CardDescription>
            Enter your card details to confirm your reservation
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Credit / Debit Card
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-4 pt-4 border-t">
                  {/* cardholder */}
                  <div className="space-y-2">
                    <Label htmlFor="cardName">
                      Name on Card
                    </Label>

                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardholderName}
                      onChange={(e) =>
                        setCardholderName(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  {/* stripe card element */}
                  <div className="space-y-2">
                    <Label>
                      Card Details
                    </Label>

                    <div className="border rounded-md px-3 py-4">
                      <CardElement
                        options={{
                          hidePostalCode: true,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {errorMessage && (
              <p className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={
                !stripe ||
                !elements ||
                !cardholderName ||
                isProcessing
              }
            >
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