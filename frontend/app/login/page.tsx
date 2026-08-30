"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  AlertCircle,
  Loader2,
  Lock,
  LogIn,
  Mail,
} from "lucide-react"

import { authService } from "@/auth/services/auth.service"
import {
  clearRedirectUrl,
  getRedirectUrl,
} from "@/auth/store/redirect.store"

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


export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsLoading(true)
    setError("")

    try {
      await authService.login({
        email,
        password,
      })

      const redirect = getRedirectUrl()

      clearRedirectUrl()
      router.push(redirect || "/")
    } catch (error) {
      console.error("Login failed:", error)

      setError(
        error instanceof Error
          ? error.message
          : "Unable to sign in."
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
                Welcome Back
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Sign in to continue with your reservations
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
                    }}
                    disabled={isLoading}
                    required
                    className="h-10 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    Password
                  </Label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)

                      if (error) {
                        setError("")
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
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="font-medium text-primary hover:underline"
                >
                  Create one
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}