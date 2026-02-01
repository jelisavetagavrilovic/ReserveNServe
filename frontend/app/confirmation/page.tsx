import { Suspense } from "react"
import { CheckCircle } from "lucide-react"
import { ConfirmationContent } from "@/components/confirmation-content"

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <CheckCircle className="h-8 w-8 animate-pulse text-green-600" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  )
}