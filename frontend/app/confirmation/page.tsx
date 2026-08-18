import { Suspense } from "react"

import { Loader2 } from "lucide-react"

import {
  ConfirmationContent,
} from "@/components/confirmation-content"


export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}