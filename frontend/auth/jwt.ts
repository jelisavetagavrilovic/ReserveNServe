// decode base64 JWT payload
export function decodeJwt(token: string): Record<string, any> | null {
  if (!token) return null
  try {
    const payload = token.split(".")[1]
    const decoded = atob(payload) // decode base64
    return JSON.parse(decoded)
  } catch (e) {
    console.error("Failed to decode JWT", e)
    return null
  }
}

// helpers za vađenje podataka iz payload-a
export function getEmailFromPayload(payload: Record<string, any>): string | null {
  return payload.email ?? null
}

export function getNameFromPayload(payload: Record<string, any>): string | null {
  return payload.name ?? payload.username ?? null
}

export function getRolesFromPayload(payload: Record<string, any>): string[] {
  if (!payload.roles) return []
  if (Array.isArray(payload.roles)) return payload.roles
  if (typeof payload.roles === "string") return payload.roles.split(",")
  return []
}