"use client"

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { useAuth } from "@/auth/hooks/useAuth"
import { authService } from "@/auth/services/auth.service"

import { PageContainer } from "@/components/page-container"
import { PageHeader } from "@/components/page-header"
import Loading from "@/components/loading"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

import {
  CalendarDays,
  Loader2,
  Mail,
  Phone,
  RotateCcw,
  Save,
  User,
  Store,
} from "lucide-react"

interface ProfileData {
  name: string
  email: string
  phone: string
}

export default function AccountPage() {
  const router = useRouter()

  const {
    user,
    isAuthenticated,
  } = useAuth()

  const [isHydrated, setIsHydrated] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(false)

  const [profileData, setProfileData] =
    useState<ProfileData>({
      name: "",
      email: "",
      phone: "",
    })

  const [originalProfile, setOriginalProfile] =
    useState<ProfileData>({
      name: "",
      email: "",
      phone: "",
    })

  const [isOwnerRequestLoading, setIsOwnerRequestLoading] =
    useState(false)

  const [ownerRequestMessage, setOwnerRequestMessage] =
    useState<string | null>(null)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (!user) return

    const data = {
      name: user.fullName,
      email: user.email,
      phone: user.phone ?? "",
    }

    setProfileData(data)
    setOriginalProfile(data)
  }, [
    isHydrated,
    isAuthenticated,
    user,
    router,
  ])

  const handleProfileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
    } = event.target

    setProfileData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const isDirty =
    profileData.name !== originalProfile.name ||
    profileData.email !== originalProfile.email ||
    profileData.phone !== originalProfile.phone

  const handleDiscardChanges = () => {
    setProfileData(originalProfile)
  }

  const handleProfileSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    if (!isDirty) return

    setIsLoading(true)

    try {
      await authService.updateUser({
        fullName: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
      })

      setOriginalProfile({
        ...profileData,
      })
    } catch (error) {
      console.error(
        "Failed to update profile:",
        error
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleOwnerRequest = async () => {
    setIsOwnerRequestLoading(true)
    setOwnerRequestMessage(null)

    try {
      const response =
        await authService.requestRestaurantOwner()

      setOwnerRequestMessage(response.message)
    } catch (error) {
      setOwnerRequestMessage(
        error instanceof Error
          ? error.message
          : "Failed to submit owner request."
      )
    } finally {
      setIsOwnerRequestLoading(false)
    }
  }

  if (
    !isHydrated ||
    !isAuthenticated ||
    !user
  ) {
    return <Loading />
  }

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-2xl">
        <PageHeader
          title="Account Settings"
          description="Manage your profile information."
          action={
            <Link href="/bookings">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                My Bookings
              </Button>
            </Link>
          }
        />

        <Card className="overflow-hidden rounded-2xl border shadow-sm">
          <CardHeader className="pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>

              <div>
                <CardTitle className="text-base">
                  Profile Information
                </CardTitle>

                <p className="mt-0.5 text-xs text-muted-foreground">
                  Update your personal and contact information
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleProfileSubmit}
              className="space-y-5"
            >
              {/* Full name */}
              <div className="space-y-2">
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
                    value={profileData.name}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
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
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
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
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    disabled={isLoading}
                    className="h-11 rounded-xl pl-10"
                  />
                </div>
              </div>

              <Separator className="my-6" />

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-xl"
                    disabled={isLoading}
                    onClick={handleDiscardChanges}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Discard Changes
                  </Button>
                )}

                <Button
                  type="submit"
                  className="rounded-xl"
                  disabled={
                    !isDirty ||
                    isLoading
                  }
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <Card className="mt-4 rounded-2xl bg-muted/10 shadow-none">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Store className="h-4 w-4 text-primary" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    Restaurant Management
                  </p>

                  {user.roles.includes("RestaurantOwner") && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Owner
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">
                  {user.roles.includes("RestaurantOwner")
                    ? "You have access to restaurant management features."
                    : "Request access if you manage a restaurant on Reserve&Serve."}
                </p>

                {ownerRequestMessage && (
                  <p className="pt-1 text-xs text-muted-foreground">
                    {ownerRequestMessage}
                  </p>
                )}
              </div>
            </div>

            {!user.roles.includes("RestaurantOwner") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl"
                disabled={isOwnerRequestLoading}
                onClick={handleOwnerRequest}
              >
                {isOwnerRequestLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Request Access"
                )}
              </Button>
            )}
          </CardContent>
        </Card>

      </div>
    </PageContainer>
  )
}