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
  if (problem.message) {
    return problem.message
  }

  if (problem.detail) {
    return problem.detail
  }

  if (problem.errors) {
    const messages = Object.values(problem.errors).flat()

    if (messages.length > 0) {
      return messages[0]
    }
  }

  if (problem.title) {
    return problem.title
  }

  return fallback
}


export async function apiRequest<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const fallback = `Request failed with status ${response.status}`
    let message = fallback

    try {
      const problem =
        (await response.json()) as ApiErrorResponse

      message = getErrorMessage(
        problem,
        fallback
      )
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