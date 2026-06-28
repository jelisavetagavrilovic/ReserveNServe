"use client"

export function saveRedirectUrl() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem("redirectAfterLogin", window.location.pathname)
  } catch {}
}

export function getRedirectUrl() {
  if (typeof window === "undefined") return "/"
  try {
    return sessionStorage.getItem("redirectAfterLogin") || "/"
  } catch {
    return "/"
  }
}

export function clearRedirectUrl() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem("redirectAfterLogin")
  } catch {}
}