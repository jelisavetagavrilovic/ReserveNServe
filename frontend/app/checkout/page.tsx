import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import { CheckoutContent } from "@/components/checkout-content"
import { StripeProvider } from "@/components/stripe-provider"

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <StripeProvider>
        <CheckoutContent />
      </StripeProvider>
      
    </Suspense>
  )
}