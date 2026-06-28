"use client"

import { useEffect } from "react"
import { authStore } from "@/auth/store/auth.store"

export function Providers({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    authStore.hydrateFromStorage()
  }, [])

  return <>{children}</>
}