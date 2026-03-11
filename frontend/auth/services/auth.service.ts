import { authStore } from "../store/auth.store"
import { AuthResponse, LoginRequest, RegisterRequest, RefreshRequest, LogoutRequest, User } from "../types/auth"

export const mockUser: User ={
    id: "user-1",
    email: "john.doe@email.com",
    name: "John Doe",
    phone: "+1 (555) 123-4567"
}

const ACCESS_KEY = "access_token"
const REFRESH_KEY = "refresh_token"
const EXPIRES_KEY = "expires_at"

export const authService = {
  // async login(data: LoginRequest) {
  //   const auth = await apiFetch("/auth/login", {
  //     method: "POST",
  //     body: JSON.stringify(data),
  //   }) as AuthResponse

  //   this.setSession(auth)
  //   return auth
  // },
  // async login(data: LoginRequest): Promise<AuthResponse> {
  //   await new Promise(r => setTimeout(r, 500)) // fake delay
  //   localStorage.setItem("access_token", "mockAccessToken")
  //   localStorage.setItem("refresh_token", "mockRefreshToken")
  //   localStorage.setItem("expires_at", new Date(Date.now() + 1000 * 60 * 60).toISOString())
  //   localStorage.setItem("user", JSON.stringify(mockUser))
  //   return {
  //     accessToken: "mockAccessToken",
  //     refreshToken: "mockRefreshToken",
  //     expiresAtUtc: new Date(Date.now() + 1000 * 60 * 60).toISOString()
  //   }
  // },
  async login(data: LoginRequest): Promise<AuthResponse> {
    await new Promise(r => setTimeout(r, 500))

    const accessToken = "mockAccessToken"
    const refreshToken = "mockRefreshToken"
    const expiresAtUtc = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    const user = { ...mockUser, email: data.email }

    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
    localStorage.setItem("expires_at", expiresAtUtc)
    localStorage.setItem("user", JSON.stringify(user))

    authStore.setTokens(accessToken, refreshToken)
    authStore.setUser(user)

    return { accessToken, refreshToken, expiresAtUtc }
  },

  // async register(data: RegisterRequest) {
  //   const auth = await apiFetch("/auth/register", {
  //     method: "POST",
  //     body: JSON.stringify(data),
  //   }) as AuthResponse

  //   this.setSession(auth)
  //   return auth
  // },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    await new Promise(r => setTimeout(r, 500)) 

    const accessToken = "mockAccessToken"
    const refreshToken = "mockRefreshToken"
    const expiresAtUtc = new Date(Date.now() + 1000 * 60 * 60).toISOString()
    const user = { ...mockUser, email: data.email }

    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
    localStorage.setItem("expires_at", expiresAtUtc)
    localStorage.setItem("user", JSON.stringify(user))

    authStore.setTokens(accessToken, refreshToken)
    authStore.setUser(user)
    return { accessToken, refreshToken, expiresAtUtc }
  },


  async updateUser(data: { name?: string; phone?: string }): Promise<User> {
    await new Promise(r => setTimeout(r, 300))

    const stored = localStorage.getItem("user")
    if (!stored) throw new Error("User not found")

    const currentUser: User = JSON.parse(stored)

    const updatedUser = {
      ...currentUser,
      ...data
    }

    localStorage.setItem("user", JSON.stringify(updatedUser))
    authStore.setUser(updatedUser)

    return updatedUser
  },

  // async refresh() {
  //   const refreshToken = localStorage.getItem(REFRESH_KEY)
  //   if (!refreshToken) throw new Error("No refresh token")

  //   const auth = await apiFetch("/auth/refresh", {
  //     method: "POST",
  //     body: JSON.stringify({ refreshToken } as RefreshRequest),
  //   }) as AuthResponse

  //   this.setSession(auth)
  //   return auth
  // },
  async refresh(): Promise<AuthResponse> {
    await new Promise(r => setTimeout(r, 300)) 

    const accessToken = "mockAccessToken"
    const refreshToken = "mockRefreshToken"
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString()

    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
    localStorage.setItem("expires_at", expiresAt)

    authStore.setTokens(accessToken, refreshToken)
    // authStore.setExpiresAt(expiresAt)
    return {
      accessToken, refreshToken, expiresAtUtc: expiresAt
    }
  },

  // async logout() {
  //   const refreshToken = localStorage.getItem(REFRESH_KEY)
  //   if (refreshToken) {
  //     await apiFetch("/auth/logout", {
  //       method: "POST",
  //       body: JSON.stringify({ refreshToken } as LogoutRequest),
  //     })
  //   }
  //   this.clearSession()
  // },
  async logout() {
    await new Promise(r => setTimeout(r, 100))
    localStorage.clear()
    authStore.clear()
  },

  setSession(auth: AuthResponse) {
    localStorage.setItem(ACCESS_KEY, auth.accessToken)
    localStorage.setItem(REFRESH_KEY, auth.refreshToken)
    localStorage.setItem(EXPIRES_KEY, auth.expiresAtUtc)
  },

  clearSession() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(EXPIRES_KEY)
  },

  getAccessToken() {
    return localStorage.getItem(ACCESS_KEY)
  },

  isAuthenticated() {
    const expires = localStorage.getItem(EXPIRES_KEY)
    return expires ? new Date(expires) > new Date() : false
  },
}


