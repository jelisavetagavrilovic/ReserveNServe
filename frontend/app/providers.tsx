// "use client"

// import { useEffect } from "react"
// import { authStore } from "@/auth/store/auth.store"

// export function Providers({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   useEffect(() => {
//     authStore.hydrateFromStorage()
//   }, [])

//   return <>{children}</>
// }

"use client"

import { useEffect } from "react"
import { authStore } from "@/auth/store/auth.store"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    authStore.hydrateFromStorage()
  }, [])

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}