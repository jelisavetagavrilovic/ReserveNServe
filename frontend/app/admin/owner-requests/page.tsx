"use client"

import {
  useEffect,
  useState,
} from "react"

import { useRouter } from "next/navigation"

import { authService } from "@/auth/services/auth.service"
import { useAuth } from "@/auth/hooks/useAuth"

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

import {
  Check,
  Loader2,
} from "lucide-react"

import type {
  PendingOwnerRequest,
} from "@/auth/types/auth.types"


export default function OwnerRequestsPage() {
  const router = useRouter()

  const {
    user,
    isAuthenticated,
  } = useAuth()

  const [requests, setRequests] =
    useState<PendingOwnerRequest[]>([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [approvingEmail, setApprovingEmail] =
    useState<string | null>(null)

  const [error, setError] =
    useState<string | null>(null)

  const [isHydrated, setIsHydrated] =
    useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      router.replace("/login")
      return
    }

    if (!user) {
      return
    }

    if (!user.roles.includes("Admin")) {
      router.replace("/")
      return
    }

    const loadRequests = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const data =
          await authService.getPendingOwnerRequests()

        setRequests(data)
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load owner requests."
        )
      } finally {
        setIsLoading(false)
      }
    }

    void loadRequests()
  }, [
    isHydrated,
    isAuthenticated,
    user,
    router,
  ])



  const handleApprove = async (
    email: string
  ) => {
    try {
      setApprovingEmail(email)
      setError(null)

      await authService.approveRestaurantOwner({
        email,
      })

      setRequests((previous) =>
        previous.filter(
          (request) =>
            request.email !== email
        )
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to approve owner request."
      )
    } finally {
      setApprovingEmail(null)
    }
  }


  if (
  !isHydrated ||
  !isAuthenticated ||
  !user
  ) {
    return <Loading />
  }


  if (!user.roles.includes("Admin")) {
    return <Loading />
  }


  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-3xl">
        <PageHeader
          title="Owner Requests"
          description="Review pending Restaurant Owner requests."
        />

        {error && (
          <Card className="mb-6 rounded-2xl border shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-destructive">
                {error}
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Loading />
        ) : requests.length === 0 ? (
          <Card className="rounded-2xl border shadow-sm">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                There are no pending owner requests.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card
                key={request.email}
                className="rounded-2xl border shadow-sm"
              >
                <CardHeader>
                  <CardTitle className="text-base">
                    {request.email}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      User: {request.userName}
                    </p>

                    <p>
                      Requested at:{" "}
                      {new Date(
                        request.ownerRequestedAtUtc
                      ).toLocaleString()}
                    </p>
                  </div>

                  <Button
                    type="button"
                    className="rounded-xl"
                    disabled={
                      approvingEmail ===
                      request.email
                    }
                    onClick={() =>
                      handleApprove(
                        request.email
                      )
                    }
                  >
                    {approvingEmail ===
                    request.email ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}