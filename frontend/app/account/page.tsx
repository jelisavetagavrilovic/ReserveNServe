"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Phone, Loader2, Save, Calendar, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/auth/hooks/useAuth"
import { authService } from "@/auth/services/auth.service"

export default function AccountPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const [originalProfile, setOriginalProfile] = useState(profileData)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    if (user) {
      const data = {
        name: user.name,
        email: user.email,
        phone: user.phone ?? ""
      }

      setProfileData(data)
      setOriginalProfile(data)
    }
  }, [isAuthenticated, user, router])

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const isDirty =
    profileData.name !== originalProfile.name ||
    profileData.email !== originalProfile.email ||
    profileData.phone !== originalProfile.phone

  const handleCancelChanges = () => {
    setProfileData(originalProfile)
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.updateUser({
        name: profileData.name,
        phone: profileData.phone
      })
    } catch (err) {
      console.error("Failed to update profile", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile information</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <Link href="/bookings">
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 py-3">
                <Calendar className="h-5 w-5" />
                View All Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    className="pl-10"
                    value={profileData.name}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={profileData.email}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    className="pl-10"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleCancelChanges}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Discard Changes
                  </Button>
                )}

                <Button type="submit" disabled={!isDirty || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
