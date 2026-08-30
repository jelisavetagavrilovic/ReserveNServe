"use client"

import { type ChangeEvent, type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import {
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  UserPlus,
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


interface RegisterFormData {
  name: string
  email: string
  phone: string
  password: string
  confirmPassword: string
}


export default function RegisterPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target

    event.target.setCustomValidity("")

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError("")
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const passwordError = getPasswordError(formData.password)

    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)

    try {
      await authService.register({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      })

      router.push("/check-email")
    } catch (error) {
      console.error("Registration failed:", error)

      setError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again."
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
                Create Account
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Create your account and start making reservations
              </p>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-3.5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />

                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Full Name
                </Label>

                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="h-10 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="h-10 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">
                  Phone Number
                </Label>

                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+381 60 123 4567"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                    className="h-10 rounded-xl pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">
                  Password
                </Label>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
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
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength={8}
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
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}