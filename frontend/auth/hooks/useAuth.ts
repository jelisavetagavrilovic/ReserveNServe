// "use client"

// import { useSyncExternalStore } from "react"
// import { authStore } from "../store/auth.store"

// export function useAuth() {

//   const auth = useSyncExternalStore(
//     authStore.subscribe.bind(authStore),
//     authStore.getSnapshot.bind(authStore)
//   )

//   return {
//     user: auth.user,
//     accessToken: auth.accessToken,
//     isAuthenticated: !!auth.accessToken
//   }
// }

"use client"

import { useEffect, useState } from "react"
import { authStore, AuthSnapshot } from "../store/auth.store"

export function useAuth() {
  const [auth, setAuth] = useState<AuthSnapshot>(authStore.getSnapshot())

  useEffect(() => {
    const unsubscribe: () => void = authStore.subscribe(setAuth)
    return () => {
      unsubscribe()
    }
  }, [])

  return {
    user: auth.user,
    accessToken: auth.accessToken,
    isAuthenticated: !!auth.accessToken
  }
}