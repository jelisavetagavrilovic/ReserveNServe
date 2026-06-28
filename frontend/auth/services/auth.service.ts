import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth.types"

import {
  loginUser,
  registerUser,
  updateUser as updateUserApi,
  refreshToken,
  logoutUser,
} from "../api/auth.api"

import { authStore } from "../store/auth.store"

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const auth = await loginUser(data)

    authStore.setAuth({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
    })

    return auth
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const auth = await registerUser(data)

    authStore.setAuth({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      user: auth.user,
    })

    return auth
  },

  async updateUser(data: {
    name?: string
    email?: string
    phone?: string
  }): Promise<User> {
    const updatedUser = await updateUserApi(data)

    authStore.setAuth({
      user: updatedUser,
    })

    return updatedUser
  },

  async refresh(): Promise<AuthResponse> {
    const auth = await refreshToken()

    authStore.setAuth({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
    })

    return auth
  },

  async logout() {
    await logoutUser()
    authStore.clear()
  },
}