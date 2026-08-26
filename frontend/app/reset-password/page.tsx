"use client"

import { Suspense, type FormEvent, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
} from "lucide-react"

import { authService } from "@/auth/services/auth.service"
import { getPasswordError } from "@/auth/utils/password-validation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


function ResetPasswordContent() {
  const searchParams = useSearchParams()

  const userId = searchParams.get("userId")
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError("")
    setSuccess("")

    if (!userId || !token) {
      setError("The password reset link is invalid or incomplete.")
      return
    }

    const passwordError = getPasswordError(password)

    if (passwordError) {
      setError(passwordError)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      const response = await authService.resetPassword({
        userId,
        token,
        newPassword: password,
      })

      setSuccess(response.message)
      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error("Password reset failed:", error)

      setError(
        error instanceof Error
          ? error.message
          : "Unable to reset your password."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-muted/20">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center px-4 py-6 sm:px-6">
        <Card className="w-full overflow-hidden rounded-2xl border shadow-sm">
          <CardHeader className="items-center space-y-3 pb-4 text-center">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Reset Password
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Choose a new password for your account
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />

                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-lg border border-green-600/20 bg-green-50 px-3 py-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />

                  <p className="text-sm text-green-700">
                    {success}
                  </p>
                </div>
              )}

              {!success && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">
                      New Password
                    </Label>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Enter your new password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value)
                          event.target.setCustomValidity("")

                          if (error) {
                            setError("")
                          }
                        }}
                        onInvalid={(event) => {
                          const message = getPasswordError(
                            event.currentTarget.value
                          )

                          if (message) {
                            event.currentTarget.setCustomValidity(message)
                          }
                        }}
                        minLength={8}
                        pattern="(?=.*[0-9]).{8,}"
                        title="Password must contain at least 8 characters and at least one number."
                        disabled={isLoading}
                        required
                        className="h-10 rounded-xl pl-10"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      8+ characters with at least one number
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword">
                      Confirm Password
                    </Label>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repeat your new password"
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value)

                          if (error) {
                            setError("")
                          }
                        }}
                        minLength={8}
                        disabled={isLoading}
                        required
                        className="h-10 rounded-xl pl-10"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-5">
              {!success && (
                <Button
                  type="submit"
                  className="w-full rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              )}

              {success && (
                <Button asChild className="w-full rounded-xl">
                  <Link href="/login">
                    Go to Sign In
                  </Link>
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}


function ResetPasswordFallback() {
  return (
    <main className="min-h-[calc(100svh-4rem)] bg-muted/20">
      <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    </main>
  )
}


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  )
}