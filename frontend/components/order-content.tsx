"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight } from "lucide-react"
import { useAppStore } from "@/lib/store"

export function YourOrder() {
  const { cart, updateCartItemQuantity, clearCart, getCartTotal } = useAppStore()
  const cartTotal = getCartTotal()

  const handleProceedToCheckout = () => {
  }

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Your Order
          </CardTitle>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={clearCart}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {cart.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No items added yet</p>
            <p className="text-xs mt-1">Pre-ordering is optional</p>
          </div>
        ) : (
          <div className="space-y-0">
            {cart.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-2 py-2 border-b last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.food_name}</p>
                  <p className="text-xs text-muted-foreground">${item.price} x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <span className="font-semibold text-sm w-16 text-right">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 font-semibold">
              <span>Total</span>
              <span className="text-primary">${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
        <Button className="w-full mt-4" size="lg" onClick={handleProceedToCheckout}>
                     {cart.length > 0 ? "Proceed to Payment" : "Book Without Pre-order"}
                     <ChevronRight className="h-4 w-4 ml-2" />
                   </Button>
      </CardContent>
    </Card>
  )
}
