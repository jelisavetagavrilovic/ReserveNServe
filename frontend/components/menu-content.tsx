"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

import {
  Minus,
  Plus,
} from "lucide-react"

import type {
  MenuCategory,
  MenuItem,
} from "@/lib/types/restaurant.types"

import { useAppStore } from "@/lib/store"
import { getImageSrc } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatters"


interface MenuContentProps {
  menuItems: MenuItem[]
}


const categories: {
  value: MenuCategory
  label: string
}[] = [
  {
    value: "appetizer",
    label: "Appetizers",
  },
  {
    value: "main",
    label: "Mains",
  },
  {
    value: "dessert",
    label: "Desserts",
  },
  {
    value: "drink",
    label: "Drinks",
  },
]


export function MenuContent({
  menuItems,
}: MenuContentProps) {
  const {
    cart,
    addToCart,
    updateCartItemQuantity,
  } = useAppStore()


  const groupedMenuItems: Record<
    MenuCategory,
    MenuItem[]
  > = {
    appetizer: menuItems.filter(
      (item) => item.category === "appetizer"
    ),

    main: menuItems.filter(
      (item) => item.category === "main"
    ),

    dessert: menuItems.filter(
      (item) => item.category === "dessert"
    ),

    drink: menuItems.filter(
      (item) => item.category === "drink"
    ),
  }


  return (
    <Card className="rounded-2xl border shadow-sm">

      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          Menu
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Choose dishes to pre-order for your reservation
        </p>
      </CardHeader>


      <CardContent>
        <Tabs
          defaultValue="appetizer"
          className="space-y-4"
        >

          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1 sm:grid-cols-4">

            {categories.map((category) => (
              <TabsTrigger
                key={category.value}
                value={category.value}
                className="rounded-md"
              >
                {category.label}
              </TabsTrigger>
            ))}

          </TabsList>


          {categories.map((category) => (
            <TabsContent
              key={category.value}
              value={category.value}
              className="mt-0 space-y-3"
            >

              {groupedMenuItems[category.value].length === 0 ? (

                <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No items available in this category.
                  </p>
                </div>

              ) : (

                groupedMenuItems[category.value].map((item) => {
                  const cartItem = cart.find(
                    (cartItem) =>
                      cartItem.id === item.id
                  )

                  return (
                    <div
                      key={item.id}
                      className="group flex gap-4 rounded-xl border bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
                    >

                      {/* Image */}
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">

                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.foodName}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                      </div>

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 flex-col">

                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">

                            <h4 className="font-semibold">
                              {item.foodName}
                            </h4>

                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>

                          </div>


                          <span className="shrink-0 whitespace-nowrap font-semibold text-primary">
                            {formatCurrency(item.price)}
                          </span>

                        </div>


                        {/* Controls */}
                        <div className="mt-auto flex justify-end pt-2">

                          {cartItem ? (

                            <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">

                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  updateCartItemQuantity(
                                    item.id,
                                    cartItem.quantity - 1
                                  )
                                }
                                aria-label={`Decrease ${item.foodName} quantity`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>


                              <span className="w-8 text-center font-medium">
                                {cartItem.quantity}
                              </span>


                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() =>
                                  updateCartItemQuantity(
                                    item.id,
                                    cartItem.quantity + 1
                                  )
                                }
                                aria-label={`Increase ${item.foodName} quantity`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>

                            </div>

                          ) : (

                            <Button
                              type="button"
                              size="sm"
                              className="h-8 px-3"
                              onClick={() =>
                                addToCart({
                                  ...item,
                                  quantity: 1,
                                })
                              }
                            >
                              <Plus className="mr-1.5 h-4 w-4" />
                              Add
                            </Button>

                          )}

                        </div>

                      </div>

                    </div>
                  )
                })

              )}

            </TabsContent>
          ))}

        </Tabs>
      </CardContent>

    </Card>
  )
}