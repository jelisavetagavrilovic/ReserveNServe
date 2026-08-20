type JwtPayload = Record<string, string | string[] | number | boolean | null | undefined>

// decode base64 JWT payload
export function decodeJwt(token: string): JwtPayload | null {
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    const decoded = atob(payload) // decode base64
    return JSON.parse(decoded) as JwtPayload
  } catch (error) {
    console.error("Failed to decode JWT", error)
    return null
  }
}

// helpers za vađenje podataka iz payload-a
export function getEmailFromPayload(payload: JwtPayload): string | null {
  return typeof payload.email === "string" ? payload.email : null
}

export function getNameFromPayload(payload: JwtPayload): string | null {
  if (typeof payload.name === "string") return payload.name
  if (typeof payload.username === "string") return payload.username
  return null
}

export function getRolesFromPayload(payload: JwtPayload): string[] {
  const roles = payload.roles
  if (!roles) return []
  if (Array.isArray(roles)) return roles.filter((role): role is string => typeof role === "string")
  if (typeof roles === "string") return roles.split(",")
  return []
}