"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  Send,
} from "lucide-react"

import { authService } from "@/auth/services/auth.service"
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


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const response = await authService.forgotPassword({
        email,
      })

      setSuccess(response.message)
    } catch (error) {
      console.error("Forgot password failed:", error)

      setError(
        error instanceof Error
          ? error.message
          : "Unable to request a password reset."
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
                Forgot Password
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Enter your email to receive a reset link
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

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value)

                      if (error) {
                        setError("")
                      }

                      if (success) {
                        setSuccess("")
                      }
                    }}
                    disabled={isLoading}
                    required
                    className="h-10 rounded-xl pl-10"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-5">
              <Button
                type="submit"
                className="w-full rounded-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                )}
              </Button>

              <Link
                href="/login"
                className="text-sm font-medium text-primary hover:underline"
              >
                Back to Sign In
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}