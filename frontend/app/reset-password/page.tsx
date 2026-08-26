"use client"

import {
  type FormEvent,
  useState,
} from "react"

import Link from "next/link"
import { useSearchParams } from "next/navigation"

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

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react"


export default function ResetPasswordPage() {
  const searchParams =
    useSearchParams()

  const userId =
    searchParams.get("userId")

  const token =
    searchParams.get("token")


  const [password, setPassword] =
    useState("")

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("")

  const [isLoading, setIsLoading] =
    useState(false)

  const [error, setError] =
    useState("")

  const [success, setSuccess] =
    useState("")


  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError("")
    setSuccess("")


    if (!userId || !token) {
      setError(
        "The password reset link is invalid or incomplete."
      )

      return
    }


    if (password !== confirmPassword) {
      setError(
        "Passwords do not match. Please enter them again."
      )

      return
    }


    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      )

      return
    }


    setIsLoading(true)

    try {
      const response =
        await authService.resetPassword({
          userId,
          token,
          newPassword: password,
        })

      setSuccess(response.message)

      setPassword("")
      setConfirmPassword("")
    } catch (error) {
      console.error(
        "Password reset failed:",
        error
      )

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
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center px-4 py-8 sm:px-6">

        <Card className="w-full overflow-hidden rounded-2xl border shadow-sm">

          <CardHeader className="text-center">

            <CardTitle className="text-2xl font-bold tracking-tight">
              Reset Password
            </CardTitle>

            <p className="mt-1.5 text-sm text-muted-foreground">
              Choose a new password for your account.
            </p>

          </CardHeader>


          <form onSubmit={handleSubmit}>

            <CardContent className="space-y-4">

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-destructive/5 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />

                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                </div>
              )}


              {success && (
                <div className="flex items-start gap-2 rounded-xl bg-green-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />

                  <p className="text-sm text-green-700">
                    {success}
                  </p>
                </div>
              )}


              {!success && (
                <>
                  <div className="space-y-2">

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
                          setPassword(
                            event.target.value
                          )

                          if (error) {
                            setError("")
                          }
                        }}
                        minLength={8}
                        disabled={isLoading}
                        required
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>

                  </div>


                  <div className="space-y-2">

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
                          setConfirmPassword(
                            event.target.value
                          )

                          if (error) {
                            setError("")
                          }
                        }}
                        minLength={8}
                        disabled={isLoading}
                        required
                        className="h-11 rounded-xl pl-10"
                      />
                    </div>

                  </div>
                </>
              )}

            </CardContent>


            <CardFooter className="flex flex-col gap-4 pt-6">

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
                <Button
                  asChild
                  className="w-full rounded-xl"
                >
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