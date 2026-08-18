"use client"

import { useAppStore } from "@/lib/store"
import { formatCurrency } from "@/lib/formatters"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import {
  ChevronRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react"


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

  const totalItems = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  )


  return (
    <Card className="rounded-2xl border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>

            <div>
              <CardTitle className="text-base">
                Your Order
              </CardTitle>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {cart.length > 0
                  ? `${totalItems} ${
                      totalItems === 1
                        ? "item"
                        : "items"
                    } selected`
                  : "Pre-ordering is optional"}
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={clearCart}
              aria-label="Clear order"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {cart.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-8 text-center">

            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </div>

            <p className="text-sm font-medium">
              Your order is empty
            </p>

            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Choose something from the menu or continue
              with just your table reservation.
            </p>
          </div>

        ) : (

          <div className="space-y-4">
            <div className="space-y-2.5">
              {cart.map((item, index) => (
                <div key={item.id}>
                  <div className="space-y-1.5">

                    {/* Name + item total */}
                    <div className="flex items-center justify-between gap-3">

                      <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {item.food_name}
                      </p>

                      <span className="shrink-0 text-sm font-semibold">
                        {formatCurrency(
                          item.price * item.quantity
                        )}
                      </span>

                    </div>

                    {/* Unit price + quantity controls */}
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.price)}
                        {" × "}
                        {item.quantity}
                      </p>

                      <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() =>
                            updateCartItemQuantity(
                              item.id,
                              item.quantity - 1
                            )
                          }
                          aria-label={`Decrease ${item.food_name} quantity`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="w-7 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() =>
                            updateCartItemQuantity(
                              item.id,
                              item.quantity + 1
                            )
                          }
                          aria-label={`Increase ${item.food_name} quantity`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>

                      </div>
                    </div>
                  </div>

                  {index < cart.length - 1 && (
                    <Separator className="mt-2.5" />
                  )}
                </div>
              ))}
            </div>

            <Separator />

            <div className="rounded-xl bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Order total
                  </p>

                  <p className="text-sm font-semibold">
                    Total
                  </p>
                </div>

                <span className="text-xl font-bold text-primary">
                  {formatCurrency(cartTotal)}
                </span>

              </div>
            </div>
          </div>
        )}

        <Button
          type="button"
          className="w-full rounded-xl"
          size="lg"
          onClick={onProceed}
        >
          {cart.length > 0
            ? "Continue to Checkout"
            : "Book Without Pre-order"}

          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>

      </CardContent>
    </Card>
  )
}