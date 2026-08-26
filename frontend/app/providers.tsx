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
import { authService } from "@/auth/services/auth.service"
import { authStore } from "@/auth/store/auth.store"

import { Elements } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

const REFRESH_BEFORE_EXPIRATION_MS =
  60 * 1000

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
    useEffect(() => {
    let refreshTimer:
      ReturnType<typeof setTimeout> | null =
      null

    let refreshInProgress = false


    const clearRefreshTimer = () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
        refreshTimer = null
      }
    }

    const scheduleRefresh = (
      state: AuthSnapshot
    ) => {
      clearRefreshTimer()


      if (
        !state.accessToken ||
        !state.refreshToken ||
        !state.expiresAtUtc
      ) {
        return
      }

    const expiresAt =
        new Date(
          state.expiresAtUtc
        ).getTime()

    const now = Date.now()

    const delay =
        expiresAt -
        now -
        REFRESH_BEFORE_EXPIRATION_MS
    
    const refreshSession =
        async () => {
          if (refreshInProgress) {
            return
          }

          refreshInProgress = true

          try {
            await authService.refresh()
          } catch (error) {
            console.error(
              "Automatic token refresh failed:",
              error
            )

            authStore.clear()
          } finally {
            refreshInProgress = false
          }
        }

        if (delay <= 0) {
          void refreshSession()
          return
        }


        refreshTimer = setTimeout(
          () => {
            void refreshSession()
          },
          delay
        )
      }

      authStore.hydrateFromStorage()

    scheduleRefresh(
      authStore.getSnapshot()
    )

    const unsubscribe =
      authStore.subscribe(
        (state) => {
          scheduleRefresh(state)
        }
      )


    return () => {
      unsubscribe()
      clearRefreshTimer()
    }
    }, [])


  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  )
}