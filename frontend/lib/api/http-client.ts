import { authStore } from "@/auth/store/auth.store"

type ApiErrorResponse = {
  message?: string
  detail?: string
  title?: string
  errors?: Record<string, string[]>
}

function getErrorMessage(
  problem: ApiErrorResponse,
  fallback: string
): string {
  if (problem.message) return problem.message
  if (problem.detail) return problem.detail

  if (problem.errors) {
    const messages = Object.values(problem.errors).flat()
    if (messages.length > 0) return messages[0]
  }

  if (problem.title) return problem.title

  return fallback
}

export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const headers = new Headers(options?.headers)

  if (options?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const token = authStore.getSnapshot().accessToken

  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`
    let message = fallback

    try {
      const problem = (await response.json()) as ApiErrorResponse
      message = getErrorMessage(problem, fallback)
    } catch {
      // Response does not contain JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}