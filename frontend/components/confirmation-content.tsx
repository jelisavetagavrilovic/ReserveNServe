"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams} from "next/navigation"
import { useAppStore } from "@/lib/store"
import { getReservationById } from "@/lib/api/reservation.api"
import type { ReservationResponse } from "@/lib/types/reservation.types"
import { ConfirmationSummary } from "@/components/confirmation-summary"
import { PageContainer } from "@/components/page-container"
import Loading from "@/components/loading"
import { Button } from "@/components/ui/button"
import {
  CalendarDays,
  CheckCircle2,
  Home,
  Mail
} from "lucide-react"


export function ConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()


  const {
    currentReservationResponse,

    clearCart,
    setSelectedTable,
    setCurrentReservationRequest,
    setCurrentReservationResponse,
  } = useAppStore()


  const reservationId =
    searchParams.get("reservationId")


  const [reservation, setReservation] =
    useState<ReservationResponse | null>(
      currentReservationResponse
    )

  const [loading, setLoading] =
    useState(
      !currentReservationResponse
    )

  const [errorMessage, setErrorMessage] =
    useState("")

  /*
   * ==========================================================
   * LOAD RESERVATION
   * ==========================================================
   */
  useEffect(() => {
    if (!reservationId) {
      setReservation(null)

      setErrorMessage(
        "Reservation ID is missing."
      )

      setLoading(false)

      return
    }

    /*
     * If the reservation is already available
     * in the application store, use it directly.
     */
    if (
      currentReservationResponse?.id ===
      reservationId
    ) {
      setReservation(
        currentReservationResponse
      )

      setErrorMessage("")
      setLoading(false)

      return
    }

    /*
     * Otherwise load it through our API/service
     * contract.
     *
     * This also allows confirmation to work after
     * a page refresh.
     */
    const loadReservation =
      async () => {
        setLoading(true)
        setErrorMessage("")

        try {
          const result =
            await getReservationById(
              reservationId
            )

          setReservation(
            result
          )

        } catch (error) {
          console.error(
            "Failed to load reservation:",
            error
          )

          setReservation(null)

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load reservation."
          )

        } finally {
          setLoading(false)
        }
      }


    void loadReservation()

  }, [
    reservationId,
    currentReservationResponse,
  ])

  /*
   * Prevent returning to checkout with browser Back
   * after confirmation has already been shown.
   */
  useEffect(() => {
    window.history.pushState(
      null,
      "",
      window.location.href
    )


    const handlePopState = () => {
      window.history.pushState(
        null,
        "",
        window.location.href
      )

      router.replace("/")
    }


    window.addEventListener(
      "popstate",
      handlePopState
    )


    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState
      )
    }

  }, [router])


  /*
   * Clear only temporary reservation-building state.
   */
  const handleFinish = () => {
    clearCart()

    setSelectedTable(null)

    setCurrentReservationRequest(
      null
    )

    setCurrentReservationResponse(
      null
    )
  }

  if (loading) {
    return <Loading />
  }

  if (
    !reservation ||
    errorMessage
  ) {
    return (
      <PageContainer className="max-w-xl">

        <div className="py-16 text-center">

          <h1 className="text-2xl font-bold tracking-tight">
            Reservation not found
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage ||
              "We couldn't load your reservation details. Please check your booking confirmation email or try again."}
          </p>

          <Button
            type="button"
            className="mt-6 rounded-xl"
            onClick={() =>
              router.push(
                "/bookings"
              )
            }
          >
            <CalendarDays className="mr-2 h-4 w-4" />

            View My Bookings
          </Button>

        </div>

      </PageContainer>
    )
  }


  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-xl">

        {/* ======================================================
            SUCCESS HEADER
        ====================================================== */}

        <div className="mb-7 text-center">

          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Reservation Confirmed!
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            Your reservation is confirmed and everything is ready for your visit
          </p>

          {reservation.paymentStatus === "NotRequired" && (
            <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span>
                We've sent a confirmation email with your reservation details.
              </span>
            </div>
          )}

          {reservation.paymentStatus === "Succeeded" && (
            <div className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span>
                We've sent a confirmation email with your reservation details and payment receipt.
              </span>
            </div>
          )}

        </div>

        {/* ======================================================
            RESERVATION SUMMARY
        ====================================================== */}

        <ConfirmationSummary
          reservation={
            reservation
          }
        />

        {/* ======================================================
            ACTIONS
        ====================================================== */}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">

          <Link
            href="/bookings"
            className="flex-1"
          >
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full rounded-xl"
              onClick={
                handleFinish
              }
            >
              <CalendarDays className="mr-2 h-4 w-4" />

              View My Bookings
            </Button>
          </Link>


          <Link
            href="/"
            className="flex-1"
          >
            <Button
              type="button"
              size="lg"
              className="w-full rounded-xl"
              onClick={
                handleFinish
              }
            >
              <Home className="mr-2 h-4 w-4" />

              Back to Home
            </Button>
          </Link>

        </div>

      </div>
    </PageContainer>
  )
}