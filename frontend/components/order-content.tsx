"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronRight,
} from "lucide-react"

import { useAppStore } from "@/lib/store"

interface YourOrderProps {
  onProceed: () => void
}

export function YourOrder({
  onProceed,
}: YourOrderProps) {
  const {
    cart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
  } = useAppStore()

  const cartTotal = getCartTotal()

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4" />
            Your Order
          </CardTitle>

          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-destructive"
              onClick={clearCart}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {cart.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-50" />

            <p className="text-sm">No items added yet</p>

            <p className="mt-1 text-xs">
              Pre-ordering is optional
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-2 border-b py-2 last:border-0"
              >
                {/* item info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {item.food_name}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    ${item.price.toFixed(2)} × {item.quantity}
                  </p>
                </div>

                {/* quantity controls */}
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() =>
                      updateCartItemQuantity(
                        item.id,
                        item.quantity - 1
                      )
                    }
                  >
                    <Minus className="h-3 w-3" />
                  </Button>

                  <span className="w-6 text-center text-sm">
                    {item.quantity}
                  </span>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() =>
                      updateCartItemQuantity(
                        item.id,
                        item.quantity + 1
                      )
                    }
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                {/* item total */}
                <span className="w-16 text-right text-sm font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            {/* cart total */}
            <div className="flex items-center justify-between pt-3 font-semibold">
              <span>Total</span>

              <span className="text-primary">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* action */}
        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={onProceed}
        >
          {cart.length > 0
            ? "Proceed to Payment"
            : "Book Without Pre-order"}

          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}