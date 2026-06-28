// "use client"

// import { User } from "../types/auth"

// export type AuthSnapshot = {
//   accessToken: string | null
//   refreshToken: string | null
//   user: User | null
// }

// const STORAGE_KEY = "auth:snapshot"

// class AuthStore {
//   private state: AuthSnapshot = {
//     accessToken: null,
//     refreshToken: null,
//     user: null,
//   }

//   private listeners = new Set<(s: AuthSnapshot) => void>()

//   subscribe(listener: (s: AuthSnapshot) => void) {
//     this.listeners.add(listener)
//     return () => {
//       this.listeners.delete(listener)
//     }
//   }

//   private emit() {
//     for (const l of this.listeners) l(this.getSnapshot())
//   }

//   getSnapshot(): AuthSnapshot {
//     return { ...this.state }
//   }

//   hydrateFromStorage() {
//     if (typeof window === "undefined") return

//     try {
//       const raw = localStorage.getItem(STORAGE_KEY)
//       this.state = raw
//         ? JSON.parse(raw)
//         : { accessToken: null, refreshToken: null, user: null }
//     } catch {
//       this.state = { accessToken: null, refreshToken: null, user: null }
//     }

//     this.emit()
//   }

//   setTokens(accessToken: string | null, refreshToken?: string | null) {
//     this.state.accessToken = accessToken
//     if (refreshToken !== undefined) {
//       this.state.refreshToken = refreshToken
//     }
//     this.persist()
//   }

//   setUser(user: User | null) {
//     this.state.user = user
//     this.persist()
//   }

//   clear() {
//     this.state = {
//       accessToken: null,
//       refreshToken: null,
//       user: null,
//     }

//     if (typeof window !== "undefined") {
//       localStorage.removeItem(STORAGE_KEY)
//     }

//     this.emit()
//   }

//   private persist() {
//     if (typeof window === "undefined") return
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
//     this.emit()
//   }
// }

// export const authStore = new AuthStore()


"use client"

import { User } from "../types/auth.types"

export type AuthSnapshot = {
  accessToken: string | null
  refreshToken: string | null
  user: User | null
}

const STORAGE_KEY = "auth:snapshot"

class AuthStore {
  private state: AuthSnapshot = {
    accessToken: null,
    refreshToken: null,
    user: null,
  }

  private listeners = new Set<(state: AuthSnapshot) => void>()

  subscribe(listener: (state: AuthSnapshot) => void) {
    this.listeners.add(listener)

    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit() {
    const snapshot = this.getSnapshot()

    for (const listener of this.listeners) {
      listener(snapshot)
    }
  }

  getSnapshot(): AuthSnapshot {
    return { ...this.state }
  }

  hydrateFromStorage() {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)

      this.state = stored
        ? JSON.parse(stored)
        : {
            accessToken: null,
            refreshToken: null,
            user: null,
          }
    } catch {
      this.state = {
        accessToken: null,
        refreshToken: null,
        user: null,
      }
    }

    this.emit()
  }

  setAuth(data: Partial<AuthSnapshot>) {
    this.state = {
      ...this.state,
      ...data,
    }

    this.persist()
  }

  clear() {
    this.state = {
      accessToken: null,
      refreshToken: null,
      user: null,
    }

    localStorage.removeItem(STORAGE_KEY)

    this.emit()
  }

  private persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    this.emit()
  }
}

export const authStore = new AuthStore()