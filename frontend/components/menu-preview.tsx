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

import type { MenuItem } from "@/lib/types/restaurant.types"
import { getImageSrc } from "@/lib/utils"

interface MenuPreviewProps {
  menuItems: MenuItem[]
}

export function MenuPreview({ menuItems }: MenuPreviewProps) {
  const groupedMenuItems = {
    appetizer: menuItems.filter((m) => m.category === "appetizer"),
    main: menuItems.filter((m) => m.category === "main"),
    dessert: menuItems.filter((m) => m.category === "dessert"),
    drinks: menuItems.filter((m) => m.category === "drinks"),
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu Preview</CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="appetizer">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="appetizer">Appetizers</TabsTrigger>
            <TabsTrigger value="main">Mains</TabsTrigger>
            <TabsTrigger value="dessert">Desserts</TabsTrigger>
            <TabsTrigger value="drinks">Drinks</TabsTrigger>
          </TabsList>

          {(["appetizer", "main", "dessert", "drinks"] as const).map(
            (category) => (
              <TabsContent
                key={category}
                value={category}
                className="space-y-4"
              >
                {groupedMenuItems[category].map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    {/* same image */}
                    <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={getImageSrc(item.image) || "/placeholder.svg"}
                        alt={item.food_name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* same content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold">
                          {item.food_name}
                        </h4>

                        <span className="font-bold text-primary whitespace-nowrap">
                          ${item.price}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </TabsContent>
            )
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}