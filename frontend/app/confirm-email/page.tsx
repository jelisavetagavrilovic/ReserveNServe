"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { authService } from "@/auth/services/auth.service"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


type ConfirmationStatus = "loading" | "success" | "error"


function ConfirmEmailContent() {
  const searchParams = useSearchParams()
  const hasStarted = useRef(false)

  const [status, setStatus] = useState<ConfirmationStatus>("loading")
  const [message, setMessage] = useState("Confirming your email...")

  useEffect(() => {
    if (hasStarted.current) {
      return
    }

    hasStarted.current = true

    const userId = searchParams.get("userId")
    const token = searchParams.get("token")

    if (!userId || !token) {
      setStatus("error")
      setMessage("The confirmation link is invalid or incomplete.")
      return
    }

    async function confirm(userId: string, token: string) {
      try {
        const response = await authService.confirmEmail({
          userId,
          token,
        })

        setStatus("success")
        setMessage(response.message)
      } catch (error) {
        console.error("Email confirmation failed:", error)

        setStatus("error")
        setMessage(
          error instanceof Error
            ? error.message
            : "Unable to confirm your email."
        )
      }
    }

    void confirm(userId, token)
  }, [searchParams])

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-muted/20">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center px-4 py-6 sm:px-6">
        <Card className="w-full overflow-hidden rounded-2xl border shadow-sm">
          <CardHeader className="items-center space-y-3 pb-4 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Email Confirmation
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center gap-3 py-3 text-center">
              {status === "loading" && (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              )}

              {status === "success" && (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              )}

              {status === "error" && (
                <AlertCircle className="h-8 w-8 text-destructive" />
              )}

              <p className="text-sm leading-6 text-muted-foreground">
                {message}
              </p>
            </div>
          </CardContent>

          {status !== "loading" && (
            <CardFooter className="pt-4">
              <Button asChild className="w-full rounded-xl">
                <Link href="/login">
                  Go to Sign In
                </Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </main>
  )
}


function ConfirmEmailFallback() {
  return (
    <main className="min-h-[calc(100svh-4rem)] bg-muted/20">
      <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </main>
  )
}


export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailFallback />}>
      <ConfirmEmailContent />
    </Suspense>
  )
}