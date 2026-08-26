// requests
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  phone: string
  password: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken: string
}

export interface ConfirmEmailRequest {
  userId: string
  token: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  userId: string
  token: string
  newPassword: string
}

// responses
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAtUtc: string
}

export interface RegisterResponse {
  message: string
  dev?: {
    userId: string
    token: string
  }
}

export interface MessageResponse {
  message: string
}

// user
export interface User {
  id: string
  email: string
  fullName: string     
  phone?: string   
  roles: string[]
}

export interface PendingOwnerRequest {
  email: string
  userName: string
  ownerRequestedAtUtc: string
}

export interface ApproveOwnerRequest {
  email: string
}