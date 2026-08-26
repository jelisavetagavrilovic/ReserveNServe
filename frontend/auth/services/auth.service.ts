import type {
  AuthResponse,
  ConfirmEmailRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
  ApproveOwnerRequest,
  PendingOwnerRequest,
  User,
} from "../types/auth.types"

import {
  confirmEmail,
  forgotPassword,
  resetPassword,
  loginUser,
  registerUser,
  updateUser as updateUserApi,
  refreshToken,
  logoutUser,
  getCurrentUser,
  requestRestaurantOwner,
  getPendingOwnerRequests,
  approveRestaurantOwner,
} from "../api/auth.api"

import { authStore } from "../store/auth.store"

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const auth = await loginUser(data)

    const user = await getCurrentUser(
      auth.accessToken
    )

    authStore.setAuth({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresAtUtc: auth.expiresAtUtc,
      user,
    })

    return auth
  },

  async register(data: 
    RegisterRequest
  ): Promise<RegisterResponse> {
    return registerUser(data)
  },

  async confirmEmail(
    data: ConfirmEmailRequest
  ): Promise<MessageResponse> {
    return confirmEmail(data)
  },

  async forgotPassword(
    data: ForgotPasswordRequest
  ): Promise<MessageResponse> {
    return forgotPassword(data)
  },

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<MessageResponse> {
    return resetPassword(data)
  },

  async updateUser(data: {
  fullName: string
  email: string
  phone?: string
  }): Promise<User> {
    const { accessToken } =
      authStore.getSnapshot()

    if (!accessToken) {
      throw new Error(
        "User is not authenticated."
      )
    }

    const updatedUser =
      await updateUserApi(
        accessToken,
        data
      )

    authStore.setAuth({
      user: updatedUser,
    })

    return updatedUser
  },

  async refresh(): Promise<AuthResponse> {
  const {
    refreshToken: currentRefreshToken,
  } = authStore.getSnapshot()

    if (!currentRefreshToken) {
      throw new Error(
        "No refresh token is available."
      )
    }

    const auth = await refreshToken(
      currentRefreshToken
    )

    authStore.setAuth({
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresAtUtc: auth.expiresAtUtc,
    })

    return auth
  },

  async requestRestaurantOwner(): Promise<MessageResponse> {
    const { accessToken } =
      authStore.getSnapshot()

      if (!accessToken) {
        throw new Error("User is not authenticated.")
      }

      return requestRestaurantOwner(
        accessToken
      )
    },


    async getPendingOwnerRequests(): Promise<PendingOwnerRequest[]> {
      const { accessToken } =
        authStore.getSnapshot()

      if (!accessToken) {
        throw new Error("User is not authenticated.")
      }

      return getPendingOwnerRequests(
        accessToken
      )
    },


    async approveRestaurantOwner(
      data: ApproveOwnerRequest
    ): Promise<MessageResponse> {
      const { accessToken } =
        authStore.getSnapshot()

      if (!accessToken) {
        throw new Error("User is not authenticated.")
      }

      return approveRestaurantOwner(
        accessToken,
        data
      )
    },

    async logout() {
      const {
        accessToken,
        refreshToken,
      } = authStore.getSnapshot()

      if (!accessToken || !refreshToken) {
        authStore.clear()
        return
      }

      try {
        await logoutUser(
          accessToken,
          refreshToken
        )
      } finally {
        authStore.clear()
      }
    },
  }