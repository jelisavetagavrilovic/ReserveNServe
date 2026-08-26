"use client"

import { useEffect, useState } from "react"

import { authStore, type AuthSnapshot } from "../store/auth.store"


export function useAuth() {
  const [auth, setAuth] = useState<AuthSnapshot>(
    authStore.getSnapshot()
  )

  useEffect(() => {
    return authStore.subscribe(setAuth)
  }, [])

  return {
    user: auth.user,
    accessToken: auth.accessToken,
    isAuthenticated: !!auth.accessToken,
  }
}