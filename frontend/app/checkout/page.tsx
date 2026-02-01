import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { CheckoutContent } from "@/components/checkout-content"

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}