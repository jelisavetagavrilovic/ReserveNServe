"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Minus } from "lucide-react"
import type { MenuItem } from "@/lib/types"
import { useAppStore } from "@/lib/store"

interface MenuContentProps {
  menuItems: MenuItem[]
}

export function MenuContent({ menuItems }: MenuContentProps) {
  const { cart, addToCart, updateCartItemQuantity } = useAppStore()

  const groupedMenuItems = {
    appetizer: menuItems.filter((m) => m.category === "appetizer"),
    main: menuItems.filter((m) => m.category === "main"),
    dessert: menuItems.filter((m) => m.category === "dessert"),
    drinks: menuItems.filter((m) => m.category === "drinks"),
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appetizer">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="appetizer">Appetizers</TabsTrigger>
            <TabsTrigger value="main">Mains</TabsTrigger>
            <TabsTrigger value="dessert">Desserts</TabsTrigger>
            <TabsTrigger value="drinks">Drinks</TabsTrigger>
          </TabsList>

          {(["appetizer", "main", "dessert", "drinks"] as const).map((category) => (
            <TabsContent key={category} value={category} className="space-y-4">
              {groupedMenuItems[category].map((item) => {
                const cartItem = cart.find((c) => c.id === item.id)
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.food_name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold">{item.food_name}</h4>
                        <span className="font-bold text-primary whitespace-nowrap">${item.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      {cartItem ? (
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateCartItemQuantity(item.id, cartItem.quantity - 1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>

                          <span className="w-8 text-center font-medium">{cartItem.quantity}</span>

                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateCartItemQuantity(item.id, cartItem.quantity + 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => addToCart({ ...item, quantity: 1 })}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
