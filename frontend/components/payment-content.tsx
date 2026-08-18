"use client"

import {
  type FormEvent,
  useState,
} from "react"

import { useRouter } from "next/navigation"

import {
  CardElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"

import { useAppStore } from "@/lib/store"

import {
  startReservationPayment,
} from "@/lib/api/reservation.api"

import {
  reconcilePaymentStatus,
} from "@/lib/api/payment.api"

import {
  formatCurrency,
} from "@/lib/formatters"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  RotateCcw,
} from "lucide-react"


export function Payment() {
  const router = useRouter()

  const stripe = useStripe()
  const elements = useElements()


  const {
    currentReservationResponse,
    updateCurrentReservationResponse,
  } = useAppStore()


  const [cardholderName, setCardholderName] =
    useState("")

  const [isProcessing, setIsProcessing] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState("")


  if (!currentReservationResponse) {
    return null
  }


  const reservation =
    currentReservationResponse

  const totalAmount =
    reservation.totalAmount ?? 0

  const paymentStatus =
    reservation.paymentStatus


  const isRetry =
    paymentStatus === "Failed"

  const isPending =
    paymentStatus === "Pending"

  const isPaid =
    paymentStatus === "Succeeded"

  const canStartPayment =
    paymentStatus === "NotStarted" ||
    paymentStatus === "Failed"


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage(
        "Payment form is not ready yet."
      )

      return
    }

    if (!cardholderName.trim()) {
      setErrorMessage(
        "Please enter the cardholder name."
      )

      return
    }

    if (!canStartPayment) {
      setErrorMessage(
        "Payment cannot be started in the current state."
      )

      return
    }

    const cardElement =
      elements.getElement(
        CardElement
      )
    if (!cardElement) {
      setErrorMessage(
        "Card details are not available."
      )

      return
    }


    setIsProcessing(true)
    setErrorMessage("")


    try {
      const payment =
        await startReservationPayment(
          reservation.id
        )

      updateCurrentReservationResponse({
        ...reservation,

        paymentStatus:
          payment.paymentStatus,
      })


      /*
       * Stripe handles the raw card data.
       */
      const result =
        await stripe.confirmCardPayment(
          payment.clientSecret,
          {
            payment_method: {
              card:
                cardElement,

              billing_details: {
                name:
                  cardholderName.trim(),
              },
            },
          }
        )


      /*
       * Immediate Stripe error.
       */
      if (result.error) {

        const updatedReservation =
          await reconcilePaymentStatus(
            reservation.id,
            "failed"
          )

        updateCurrentReservationResponse(
          updatedReservation
        )

        setErrorMessage(
          result.error.message ??
            "Payment failed. Please try again."
        )

        return
      }


      /*
       * Stripe succeeded.
       */
      if (
        result.paymentIntent?.status ===
        "succeeded"
      ) {

        const updatedReservation =
          await reconcilePaymentStatus(
            reservation.id,
            "succeeded"
          )


        updateCurrentReservationResponse(
          updatedReservation
        )


        router.push(
          `/confirmation?reservationId=${updatedReservation.id}`
        )


        return
      }


      setErrorMessage(
        "Payment is still being processed."
      )

    } catch (error) {

      console.error(
        "Payment error:",
        error
      )


      /*
       * Do not manually force Failed here.
       *
       * An exception does not necessarily mean
       * Stripe rejected the payment.
       */
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Payment could not be completed. Please try again."
      )

    } finally {

      setIsProcessing(false)

    }
  }


  return (
    <div>

      {/* Payment heading */}
      <div className="mb-5">

        <div className="flex items-center gap-2">

          <CreditCard className="h-4 w-4 text-primary" />

          <h3 className="text-base font-semibold">
            Payment
          </h3>

        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          Complete payment for your food pre-order
        </p>

      </div>


      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* Name */}
        <div className="space-y-2">

          <Label htmlFor="cardholderName">
            Name on Card
          </Label>


          <Input
            id="cardholderName"
            type="text"
            autoComplete="cc-name"
            placeholder="John Doe"
            value={
              cardholderName
            }
            onChange={(event) => {

              setCardholderName(
                event.target.value
              )


              if (errorMessage) {
                setErrorMessage("")
              }

            }}
            disabled={
              isProcessing ||
              isPending ||
              isPaid
            }
            className="h-11"
          />

        </div>


        {/* Card */}
        <div className="space-y-2">

          <Label>
            Card Details
          </Label>


          <div
            className="
              rounded-lg
              border
              bg-background
              px-3
              py-4
              transition-colors
              focus-within:border-primary/50
              focus-within:ring-1
              focus-within:ring-primary/20
            "
          >

            <CardElement
              options={{
                hidePostalCode:
                  true,

                disabled:
                  isProcessing ||
                  isPending ||
                  isPaid,
              }}
            />

          </div>


          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">

            <Lock className="h-3 w-3 shrink-0" />

            <span>
              Securely processed by Stripe
            </span>

          </div>

        </div>


        {/* Failed */}
        {isRetry && (
          <div className="rounded-xl bg-destructive/5 p-3">

            <div className="flex items-start gap-2">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />


              <div>

                <p className="text-sm font-medium text-destructive">
                  Payment failed
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Check your card details and try again.
                </p>

              </div>

            </div>

          </div>
        )}


        {/* Pending */}
        {isPending && (
          <div className="rounded-xl bg-muted/50 p-3">

            <div className="flex items-start gap-2">

              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-muted-foreground" />


              <div>

                <p className="text-sm font-medium">
                  Processing payment
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Please wait while your payment is confirmed.
                </p>

              </div>

            </div>

          </div>
        )}


        {/* Paid */}
        {isPaid && (
          <div className="rounded-xl bg-primary/5 p-3">

            <div className="flex items-start gap-2">

              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />


              <div>

                <p className="text-sm font-medium">
                  Payment completed
                </p>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your food pre-order has been paid successfully.
                </p>

              </div>

            </div>

          </div>
        )}


        {/* Error */}
        {errorMessage && !isRetry && (
          <div className="rounded-xl bg-destructive/5 p-3">

            <div className="flex items-start gap-2">

              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

              <p className="text-sm text-destructive">
                {errorMessage}
              </p>

            </div>

          </div>
        )}


        {/* Pay */}
        <Button
          type="submit"
          size="lg"
          className="w-full rounded-xl"
          disabled={
            !stripe ||
            !elements ||
            !cardholderName.trim() ||
            !canStartPayment ||
            isProcessing ||
            isPending ||
            isPaid
          }
        >

          {isProcessing ||
          isPending ? (

            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />

              Processing...
            </>

          ) : isPaid ? (

            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />

              Paid
            </>

          ) : isRetry ? (

            <>
              <RotateCcw className="mr-2 h-4 w-4" />

              Retry Payment{" "}
              {formatCurrency(
                totalAmount
              )}
            </>

          ) : (

            <>
              <Lock className="mr-2 h-4 w-4" />

              Pay{" "}
              {formatCurrency(
                totalAmount
              )}
            </>

          )}

        </Button>

      </form>

    </div>
  )
}