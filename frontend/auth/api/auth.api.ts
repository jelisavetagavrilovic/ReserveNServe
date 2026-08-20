import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "../types/auth.types"

const mockUser: User = {
  id: "user-1",
  email: "john.doe@email.com",
  name: "John Doe",
  phone: "+1 (555) 123-4567",
}

export async function loginUser(
  data: LoginRequest
): Promise<AuthResponse & { user: User }> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    accessToken: "mockAccessToken",
    refreshToken: "mockRefreshToken",
    expiresAtUtc: new Date(
      Date.now() + 1000 * 60 * 60
    ).toISOString(),
    user: {
      ...mockUser,
      email: data.email,
    },
  }
}

export async function registerUser(
  data: RegisterRequest
): Promise<AuthResponse & { user: User }> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    accessToken: "mockAccessToken",
    refreshToken: "mockRefreshToken",
    expiresAtUtc: new Date(
      Date.now() + 1000 * 60 * 60
    ).toISOString(),
    user: {
      ...mockUser,
      email: data.email,
      name: data.name,
      phone: data.phone,
    },
  }
}

export async function updateUser(
  data: { name?: string; email?: string; phone?: string }
): Promise<User> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    id: "user-1",
    email: data.email ?? "john.doe@email.com",
    name: data.name ?? "John Doe",
    phone: data.phone ?? "+1 (555) 123-4567",
  }
}

export async function refreshToken(): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    accessToken: "mockAccessToken",
    refreshToken: "mockRefreshToken",
    expiresAtUtc: new Date(
      Date.now() + 1000 * 60 * 60
    ).toISOString(),
  }
}

export async function logoutUser(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 100))
}