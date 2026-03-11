// requests
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface LogoutRequest {
  refreshToken: string
}

// responses
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAtUtc: string
}

// user
export interface User {
  id: string
  email: string
  name: string     
  phone?: string   
  role?: string
}