import Link from "next/link"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


export default function CheckEmailPage() {
  return (
    <main className="min-h-[calc(100svh-4rem)] bg-muted/20">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-md items-center px-4 py-6 sm:px-6">
        <Card className="w-full overflow-hidden rounded-2xl border shadow-sm">
          <CardHeader className="items-center space-y-3 pb-4 text-center">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Check Your Email
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                We sent you a link to confirm your account
              </p>
            </div>
          </CardHeader>

          <CardContent>
            <p className="text-center text-sm leading-6 text-muted-foreground">
              Open the confirmation email and follow the link before signing in.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}