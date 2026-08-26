"use client"

import type { ReactNode } from "react"

import {
  Elements,
} from "@stripe/react-stripe-js"

import {
  loadStripe,
} from "@stripe/stripe-js"


const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

if (!publishableKey) {
  throw new Error(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured"
  )
}

const stripePromise =
  loadStripe(
    publishableKey
  )

interface StripeProviderProps {
  children: ReactNode
}

export function StripeProvider({
  children,
}: StripeProviderProps) {
  return (
    <Elements
      stripe={stripePromise}
    >
      {children}
    </Elements>
  )
}