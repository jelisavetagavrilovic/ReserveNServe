import { apiRequest } from "@/lib/api/http-client"

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

const IDENTITY_API_URL =
  process.env.NEXT_PUBLIC_IDENTITY_API_URL

if (!IDENTITY_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_IDENTITY_API_URL environment variable is not configured."
  )
}


const mockUser: User = {
  id: "user-1",
  fullName: "john.doe@email.com",
  name: "John Doe",
  phone: "+1 (555) 123-4567",
  roles: ["User"]
}

export async function loginUser(
  data: LoginRequest
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(
    `${IDENTITY_API_URL}/api/auth/login`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

export async function registerUser(
  data: RegisterRequest
): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>(
    `${IDENTITY_API_URL}/api/auth/register`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

export async function confirmEmail(
  data: ConfirmEmailRequest
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(
    `${IDENTITY_API_URL}/api/auth/confirm-email`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(
    `${IDENTITY_API_URL}/api/auth/forgot-password`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

export async function resetPassword(
  data: ResetPasswordRequest
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(
    `${IDENTITY_API_URL}/api/auth/reset-password`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  )
}

export async function getCurrentUser(
  accessToken: string
): Promise<User> {
  return apiRequest<User>(
    `${IDENTITY_API_URL}/api/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
}

export async function updateUser(
  accessToken: string,
  data: {
    fullName: string
    email: string
    phone?: string
  }
): Promise<User> {
  return apiRequest<User>(
    `${IDENTITY_API_URL}/api/auth/me`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }
  )
}

export async function refreshToken(
  refreshTokenValue: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(
    `${IDENTITY_API_URL}/api/auth/refresh`,
    {
      method: "POST",
      body: JSON.stringify({
        refreshToken: refreshTokenValue,
      }),
    }
  )
}

export async function logoutUser(
  accessToken: string,
  refreshToken: string
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(
    `${IDENTITY_API_URL}/api/auth/logout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        refreshToken,
      }),
    }
  )
}

export async function requestRestaurantOwner(
  accessToken: string
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(
    `${IDENTITY_API_URL}/api/owners/requests`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
}

export async function getPendingOwnerRequests(
  accessToken: string
): Promise<PendingOwnerRequest[]> {
  return apiRequest<PendingOwnerRequest[]>(
    `${IDENTITY_API_URL}/api/owners/requests`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )
}

export async function approveRestaurantOwner(
  accessToken: string,
  data: ApproveOwnerRequest
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>(
    `${IDENTITY_API_URL}/api/owners/requests/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }
  )
}