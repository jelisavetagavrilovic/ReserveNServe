"use client"

import type { Table } from "@/lib/types/restaurant.types"
import { cn } from "@/lib/utils"

import {
  Check,
  MapPin,
  Users,
} from "lucide-react"

interface TableLayoutProps {
  tables: Table[]
  selectedTable: Table | null
  onSelectTable: (table: Table) => void
  partySize: number
}

export function TableLayout({
  tables,
  selectedTable,
  onSelectTable,
  partySize,
}: TableLayoutProps) {
  const getTableStatus = (table: Table) => {
    if (table.availableNumber === 0) return "unavailable"
    if (table.seats < partySize) return "too-small"
    if (selectedTable?.id === table.id) return "selected"
    return "available"
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <LegendItem className="bg-emerald-500" label="Available" />
        <LegendItem className="bg-primary" label="Selected" />
        <LegendItem className="bg-amber-500" label="Too small" />
        <LegendItem className="bg-muted-foreground/40" label="Reserved" />
      </div>

      {/* Tables */}
      <div className="grid gap-2.5 sm:grid-cols-2">
        {tables.map((table) => {
          const status = getTableStatus(table)
          const isClickable =
            status === "available" ||
            status === "selected"

          return (
            <button
              key={table.id}
              type="button"
              disabled={!isClickable}
              onClick={() => {
                if (isClickable) {
                  onSelectTable(table)
                }
              }}
              className={cn(
                "flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all",
                status === "available" &&
                  "bg-background hover:border-primary/40 hover:bg-muted/20",
                status === "selected" &&
                  "border-primary bg-primary/5 ring-1 ring-primary/20",
                status === "too-small" &&
                  "cursor-not-allowed bg-muted/20 opacity-60",
                status === "unavailable" &&
                  "cursor-not-allowed bg-muted/30 opacity-50"
              )}
            >
              <div className="flex min-w-0 items-center gap-4">
                {/* Seats */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">
                    {table.seats} seats
                  </span>
                </div>

                {/* Location */}
                <div className="flex min-w-0 items-center gap-1.5">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm capitalize text-muted-foreground">
                    {table.location}
                  </span>
                </div>
              </div>

              {/* Availability */}
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={cn(
                    "hidden text-xs xl:inline",
                    status === "available" &&
                      "text-emerald-600",
                    status === "selected" &&
                      "font-medium text-primary",
                    status === "too-small" &&
                      "text-amber-600",
                    status === "unavailable" &&
                      "text-muted-foreground"
                  )}
                >
                  {status === "too-small"
                    ? "Too small"
                    : table.availableNumber === 0
                      ? "Reserved"
                      : `${table.availableNumber} available`}
                </span>

                {status === "selected" ? (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "h-2.5 w-2.5 rounded-full",
                      status === "available" &&
                        "bg-emerald-500",
                      status === "too-small" &&
                        "bg-amber-500",
                      status === "unavailable" &&
                        "bg-muted-foreground/40"
                    )}
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface LegendItemProps {
  className: string
  label: string
}

function LegendItem({
  className,
  label,
}: LegendItemProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          className
        )}
      />
      <span>{label}</span>
    </div>
  )
}