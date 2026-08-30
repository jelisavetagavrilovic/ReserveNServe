"use client"

import Image from "next/image"

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

import type {
  MenuCategory,
  MenuItem,
} from "@/lib/types/restaurant.types"

import { getImageSrc } from "@/lib/utils"
import { formatCurrency } from "@/lib/formatters"

interface MenuPreviewProps {
  menuItems: MenuItem[]
}

const categories: {
  value: MenuCategory
  label: string
}[] = [
  { value: "appetizer", label: "Appetizers" },
  { value: "main", label: "Mains" },
  { value: "dessert", label: "Desserts" },
  { value: "drink", label: "Drinks" },
]

export function MenuPreview({
  menuItems,
}: MenuPreviewProps) {
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
          Menu Preview
        </CardTitle>

        <p className="text-sm text-muted-foreground">
          Explore the restaurant menu before booking
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

          {categories.map((category) => {
            const items =
              groupedMenuItems[category.value]

            return (
              <TabsContent
                key={category.value}
                value={category.value}
                className="mt-0"
              >
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed px-4 py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No items available in this category.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 py-4 first:pt-0 last:pb-0"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={item.image || "/placeholder.svg"}
                            alt={item.foodName}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="text-sm font-bold leading-snug">
                              {item.foodName}
                            </h4>

                            <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary">
                              {formatCurrency(item.price)}
                            </span>
                          </div>

                          {item.description && (
                            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      </CardContent>
    </Card>
  )
}