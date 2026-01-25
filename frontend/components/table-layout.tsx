"use client"

import type { Table } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Users, MapPin, CheckCircle, XCircle } from "lucide-react"

interface TableLayoutProps {
  tables: Table[]
  selectedTable: Table | null
  onSelectTable: (table: Table) => void
  partySize: number
}

export function TableLayout({ tables, selectedTable, onSelectTable, partySize }: TableLayoutProps) {
  const getTableStatus = (table: Table) => {
    if (table.available_number === 0) return "unavailable"
    if (table.seats < partySize) return "too-small"
    if (selectedTable?.id === table.id) return "selected"
    return "available"
  }

  return (
    <div className="space-y-4">
      {/* legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 opacity-60" />
          <span>Too Small</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted-foreground opacity-50" />
          <span>Reserved</span>
        </div>
      </div>

      {/* table list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tables.map((table) => {
          const status = getTableStatus(table)
          const isClickable = status === "available" || status === "selected"

          return (
            <button
              key={table.id}
              onClick={() => isClickable && onSelectTable(table)}
              disabled={!isClickable}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border-2 transition-all text-left",
                status === "selected" && "bg-primary text-primary-foreground border-primary",
                status === "available" &&
                  "bg-card border-green-400 hover:border-green-500 hover:bg-green-50 cursor-pointer",
                status === "too-small" && "bg-amber-50 border-amber-300 opacity-60 cursor-not-allowed",
                status === "unavailable" && "bg-muted border-muted opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3 text-sm opacity-80">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {table.seats} seats
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <MapPin className="h-3.5 w-3.5" />
                    {table.location}
                  </span>
                  <span className="flex items-center gap-1">
                    {table.available_number > 0 ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                    {table.available_number === 0
                        ? "No tables available"
                        : table.available_number === 1
                        ? "1 table available"
                        : `${table.available_number} tables available`}
                </span>
                </div>
              </div>
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  status === "selected" && "bg-primary-foreground",
                  status === "available" && "bg-green-500",
                  status === "too-small" && "bg-amber-500",
                  status === "unavailable" && "bg-muted-foreground",
                )}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
