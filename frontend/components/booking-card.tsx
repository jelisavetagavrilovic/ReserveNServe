"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Calendar, Clock, Users, MapPin, Utensils, X, Armchair } from "lucide-react"
import { format, parse } from "date-fns"
import { ReservationResponse } from "@/lib/types/reservation.types"

interface BookingCardProps {
  reservation: ReservationResponse
  showActions?: boolean
  onCancel?: (id: string) => void
}

export const BookingCard = ({ reservation, showActions = false, onCancel }: BookingCardProps) => {
  const preOrderItems = reservation.orders ?? []

  const handleCancel = () => {
    if (onCancel) onCancel(reservation.id)
  }

  return (
    <Card className="overflow-hidden shadow-md rounded-lg border hover:shadow-lg transition-all">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">{reservation.restaurantName}</CardTitle>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {reservation.restaurantAddress}, {reservation.restaurantCity}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-2 md:mt-0 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{format(parse(reservation.date, "yyyy-MM-dd", new Date()), "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{reservation.startTime}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{reservation.guestNumber} guests</span>
            </div>
            <div className="flex items-center gap-1">
              <Armchair className="h-4 w-4" />
              <span>{reservation.tableLocation} ({reservation.tableSeats} seats)</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {preOrderItems.length > 0 && (
        <CardContent className="pt-0">
          <div className="border-t mt-2 pt-3">
            <h4 className="flex items-center gap-1 mb-2 font-medium text-sm text-muted-foreground">
              <Utensils className="h-4 w-4" /> Pre-ordered Items 
              {reservation.servingTime && (
                <span className="text-sm text-muted-foreground">
                  (Serve at {reservation.servingTime})
                </span>
              )}
            </h4>
            <div className="space-y-1">
              {preOrderItems.map((item) => (
                <div key={item.menuItemId} className="flex justify-between text-sm text-muted-foreground">
                  <span>{item.quantity}x {item.foodName}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-medium mt-2 pt-2 border-t">
              <span>Total</span>
              <span>${reservation.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      )}

      {showActions && reservation.status !== "Cancelled" && (
        <CardContent className="pt-3">
          <div className="flex flex-col md:flex-row gap-2 md:gap-3">
            <Link href={`/restaurants/${reservation.restaurantId}`} className="flex-1">
              <Button variant="outline" className="w-full bg-transparent">
                View Restaurant
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive bg-transparent">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Reservation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel your reservation at {reservation.restaurantName}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Reservation</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCancel}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Cancel Reservation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      )}
    </Card>
  )
}