"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useAppStore } from "@/lib/store"

import {
  startReservationPayment,
} from "@/lib/services/reservation.service"

import {
  confirmMockPayment,
  failMockPayment,
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
  RotateCcw,
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

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")

  const [cardholderName, setCardholderName] =
    useState("")


  if (!currentReservationResponse) {
    return (
      <div className="text-center py-16">
        <p>No reservation in progress</p>

        <Button
          onClick={() => router.push("/")}
        >
          Go Home
        </Button>
      </div>
    )
  }


  const reservation =
    currentReservationResponse

  const totalAmount =
    reservation.totalAmount ?? 0

  const formattedTotal =
    new Intl.NumberFormat("sr-RS", {
      style: "currency",
      currency: "RSD",
    }).format(totalAmount)

  const paymentStatus =
    reservation.paymentStatus

  const isRetry =
    paymentStatus === "Failed"

  const isPending =
    paymentStatus === "Pending"

  const isPaid =
    paymentStatus === "Succeeded"


  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage(
        "Stripe is not ready yet."
      )
      return
    }

    if (!cardholderName.trim()) {
      setErrorMessage(
        "Please enter cardholder name."
      )
      return
    }

    /*
     * Payment can be started:
     *
     * NotStarted -> first payment attempt
     * Failed     -> retry
     *
     * Pending and Succeeded must not start
     * another payment attempt.
     */
    if (
      paymentStatus !== "NotStarted" &&
      paymentStatus !== "Failed"
    ) {
      setErrorMessage(
        "Payment cannot be started in the current state."
      )
      return
    }


    const cardElement =
      elements.getElement(CardElement)

    if (!cardElement) {
      setErrorMessage(
        "Card element is not available."
      )
      return
    }


    setIsProcessing(true)
    setErrorMessage("")


    try {
      /*
       * ======================================================
       * STEP 1 — START PAYMENT
       * ======================================================
       *
       * CURRENT MOCK:
       *
       * startReservationPayment() changes our local
       * reservation:
       *
       * NotStarted -> Pending
       *
       * or:
       *
       * Failed -> Pending
       *
       * and returns the REAL Stripe clientSecret
       * that you manually configured for testing.
       *
       *
       * LATER:
       *
       * The component does NOT change.
       *
       * startReservationPayment() will really call:
       *
       * POST /api/reservations/{id}/payment
       *
       * Reservations Service
       *      ->
       * Payment Service
       *      ->
       * Stripe
       *
       * and the backend will return clientSecret.
       */
      const payment =
        await startReservationPayment(
          reservation.id
        )


      /*
       * Synchronize frontend state with
       * Reservations state:
       *
       * paymentStatus = Pending
       */
      updateCurrentReservationResponse({
        ...reservation,
        paymentStatus:
          payment.paymentStatus,
      })


      /*
       * ======================================================
       * STEP 2 — CONFIRM PAYMENT WITH REAL STRIPE
       * ======================================================
       *
       * Card details entered into CardElement
       * are sent directly to Stripe.
       *
       * Our application never receives the raw
       * card number.
       */
      const result =
        await stripe.confirmCardPayment(
          payment.clientSecret,
          {
            payment_method: {
              card: cardElement,

              billing_details: {
                name: cardholderName.trim(),
              },
            },
          }
        )


      /*
       * ======================================================
       * STEP 3A — STRIPE PAYMENT FAILED
       * ======================================================
       */
      if (result.error) {
        /*
         * MOCK ONLY
         *
         * In production this will NOT be called
         * from the frontend.
         *
         * Real flow:
         *
         * Stripe webhook
         *      ->
         * Payment Service
         *      ->
         * Reservations Service
         *
         * PaymentFailed
         *
         * For now we simulate that callback.
         */
        const failedReservation =
          await failMockPayment(
            reservation.id
          )


        updateCurrentReservationResponse(
          failedReservation
        )


        setErrorMessage(
          result.error.message ??
            "Payment failed. Please try again."
        )

        return
      }


      /*
       * ======================================================
       * STEP 3B — STRIPE PAYMENT SUCCEEDED
       * ======================================================
       */
      if (
        result.paymentIntent?.status ===
        "succeeded"
      ) {
        /*
         * MOCK ONLY
         *
         * Again, frontend normally would NOT
         * tell Reservations Service that payment
         * succeeded.
         *
         * Real production flow:
         *
         * Stripe
         *      ->
         * webhook
         *      ->
         * Payment Service
         *      ->
         * Reservations Service
         *
         * PaymentSucceeded
         *
         * For now we simulate that callback.
         */
        const succeededReservation =
          await confirmMockPayment(
            reservation.id
          )


        updateCurrentReservationResponse(
          succeededReservation
        )


        router.push(
          `/confirmation?reservationId=${succeededReservation.id}`
        )

        return
      }


      /*
       * Stripe returned no error, but payment
       * is not in a final succeeded state.
       *
       * This normally should be handled according
       * to the PaymentIntent state / webhook.
       */
      setErrorMessage(
        "Payment is still being processed."
      )

    } catch (error) {
      console.error(
        "Payment error:",
        error
      )

      /*
       * Important:
       *
       * We do NOT blindly set Failed here.
       *
       * The exception may have happened before
       * Stripe even processed the payment
       * (network error, bad clientSecret, etc.).
       *
       * In the real system Payment Service /
       * Stripe webhook will be the source of truth.
       */
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again."
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
            Enter your card details to complete
            your food preorder
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

                  {/* Cardholder name */}

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
                      disabled={
                        isProcessing ||
                        isPending ||
                        isPaid
                      }
                    />

                  </div>


                  {/*
                   * REAL STRIPE ELEMENT
                   *
                   * You can enter Stripe test cards
                   * directly here.
                   *
                   * Stripe owns the sensitive card
                   * information.
                   */}
                  <div className="space-y-2">

                    <Label>
                      Card Details
                    </Label>

                    <div className="border rounded-md px-3 py-4">

                      <CardElement
                        options={{
                          hidePostalCode: true,

                          disabled:
                            isProcessing ||
                            isPending ||
                            isPaid,
                        }}
                      />

                    </div>

                  </div>

                </div>

              </CardContent>

            </Card>


            {/* Current payment state */}

            {isRetry && (
              <div className="rounded-md border p-3">
                <p className="text-sm text-destructive">
                  Previous payment attempt failed.
                  You can try again.
                </p>
              </div>
            )}


            {isPending && (
              <div className="rounded-md border p-3">
                <p className="text-sm text-muted-foreground">
                  Payment is being processed.
                </p>
              </div>
            )}


            {isPaid && (
              <div className="rounded-md border p-3">
                <div className="flex items-center gap-2">

                  <CheckCircle2 className="h-4 w-4" />

                  <p className="text-sm">
                    Payment completed successfully.
                  </p>

                </div>
              </div>
            )}


            {/* Error */}

            {errorMessage && (
              <p className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}


            {/*
             * BUTTON STATE
             *
             * NotStarted
             *    -> Pay $...
             *
             * Failed
             *    -> Retry Payment $...
             *
             * Pending
             *    -> Processing...
             *
             * Succeeded
             *    -> Paid
             */}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={
                !stripe ||
                !elements ||
                !cardholderName.trim() ||
                isProcessing ||
                isPending ||
                isPaid
              }
            >

              {isProcessing || isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />

                  Processing...
                </>
              ) : isPaid ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />

                  Paid
                </>
              ) : isRetry ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />

                  Retry Payment {formattedTotal}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />

                  Pay {formattedTotal}
                </>
              )}

            </Button>

          </form>

        </CardContent>

      </Card>

    </div>
  )
}