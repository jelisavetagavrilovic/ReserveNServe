// "use client"

// import { useState } from "react"
// import { useRouter } from "next/navigation"
// import { useAppStore } from "@/lib/store"
// import { processPayment } from "@/lib/services/reservation.service"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
// import {
//   CreditCard,
//   Loader2,
//   Lock,
//   CheckCircle2,
// } from "lucide-react"

// export function Payment() {
//   const router = useRouter()
//   const {
//     currentReservationResponse,
//     updateCurrentReservationResponse,
//     // addReservation,
//   } = useAppStore()

//   const [isProcessing, setIsProcessing] = useState(false)
//   const [cardDetails, setCardDetails] = useState({
//     number: "",
//     expiry: "",
//     cvc: "",
//     name: "",
//   })

//   if (!currentReservationResponse) {
//     return (
//       <div className="text-center py-16">
//         <p>No reservation in progress</p>
//         <Button onClick={() => router.push("/")}>Go Home</Button>
//       </div>
//     )
//   }

//   const totalAmount = currentReservationResponse.totalAmount ?? 0

//   const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target
//     const inputName = name

//     let nextValue = value

//     if (inputName === "number") {
//       nextValue = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim()
//       if (nextValue.length > 19) return
//     }

//     if (inputName === "expiry") {
//       nextValue = value.replace(/\D/g, "")
//       if (nextValue.length >= 2) {
//         nextValue = nextValue.slice(0, 2) + "/" + nextValue.slice(2, 4)
//       }
//       if (nextValue.length > 5) return
//     }

//     if (inputName === "cvc") {
//       nextValue = value.replace(/\D/g, "")
//       if (nextValue.length > 4) return
//     }

//     setCardDetails((prev) => ({ ...prev, [inputName]: nextValue }))
//   }

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) return
//     //if (!currentReservationResponse.id) return

//     setIsProcessing(true)

//     try {
//       const updatedReservation = await processPayment(currentReservationResponse.id)
//       if (!updatedReservation) throw new Error("Reservation not found")

//       updateCurrentReservationResponse(updatedReservation)

//       router.push(`/confirmation?reservationId=${updatedReservation.id}`)
//     } catch (error) {
//       console.error("Payment failed:", error)
//     } finally {
//       setIsProcessing(false)
//     }
//   }

//   return (
//     <div className="lg:sticky lg:top-24 space-y-6 h-fit">
//       <Card>
//         <CardHeader>
//           <CardTitle className="text-lg">Payment Details</CardTitle>
//           <CardDescription>
//             Enter your card details to confirm your reservation
//           </CardDescription>
//         </CardHeader>

//         <CardContent>
//           <form onSubmit={handleSubmit} className="space-y-5">
//             <Card>
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <CreditCard className="h-4 w-4" />
//                   Credit / Debit Card
//                 </CardTitle>
//               </CardHeader>

//               <CardContent className="space-y-4">
//                 <div className="space-y-4 pt-4 border-t">
//                   <div className="space-y-2">
//                     <Label htmlFor="cardName">Name on Card</Label>
//                     <Input
//                       id="cardName"
//                       name="name"
//                       placeholder="John Doe"
//                       className="placeholder:text-muted-foreground/60"
//                       value={cardDetails.name}
//                       onChange={handleCardChange}
//                     />
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="cardNumber">Card Number</Label>
//                     <div className="relative">
//                       <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                       <Input
//                         id="cardNumber"
//                         name="number"
//                         placeholder="1234 5678 9012 3456"
//                         className="pl-10 placeholder:text-muted-foreground/60"
//                         value={cardDetails.number}
//                         onChange={handleCardChange}
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="expiry">Expiry Date</Label>
//                       <Input
//                         id="expiry"
//                         name="expiry"
//                         placeholder="MM/YY"
//                         className="placeholder:text-muted-foreground/60"
//                         value={cardDetails.expiry}
//                         onChange={handleCardChange}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="cvc">CVC</Label>
//                       <div className="relative">
//                         <Input
//                           id="cvc"
//                           name="cvc"
//                           placeholder="123"
//                           className="placeholder:text-muted-foreground/60"
//                           value={cardDetails.cvc}
//                           onChange={handleCardChange}
//                         />
//                         <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             <Button type="submit" size="lg" className="w-full" disabled={!cardDetails.name || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || isProcessing}>
//               {isProcessing ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Processing...
//                 </>
//               ) : totalAmount > 0 ? (
//                 <>
//                   <Lock className="h-4 w-4 mr-2" />
//                   Pay ${totalAmount.toFixed(2)} & Confirm
//                 </>
//               ) : (
//                 <>
//                   <CheckCircle2 className="h-4 w-4 mr-2" />
//                   Confirm Reservation
//                 </>
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }


"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useAppStore } from "@/lib/store"
import { processPayment } from "@/lib/services/reservation.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

import {
  CreditCard,
  Loader2,
  Lock,
  CheckCircle2,
} from "lucide-react"

export function Payment() {
  const router = useRouter()

  const {
    currentReservationResponse,
    updateCurrentReservationResponse,
  } = useAppStore()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  })

  if (!currentReservationResponse) {
    return (
      <div className="text-center py-16">
        <p>No reservation in progress</p>

        <Button onClick={() => router.push("/")}>
          Go Home
        </Button>
      </div>
    )
  }

  const totalAmount = currentReservationResponse.totalAmount ?? 0

  const isCardValid =
    cardDetails.number.replace(/\s/g, "").length === 16 &&
    cardDetails.expiry.length === 5 &&
    cardDetails.cvc.length >= 3 &&
    cardDetails.name.trim().length > 2

  const handleCardChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    let nextValue = value

    if (name === "number") {
      nextValue = value
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 ")
    }

    if (name === "expiry") {
      nextValue = value.replace(/\D/g, "")

      if (nextValue.length >= 2) {
        nextValue =
          nextValue.slice(0, 2) +
          "/" +
          nextValue.slice(2, 4)
      }

      nextValue = nextValue.slice(0, 5)
    }

    if (name === "cvc") {
      nextValue = value.replace(/\D/g, "").slice(0, 4)
    }

    setCardDetails((prev) => ({
      ...prev,
      [name]: nextValue,
    }))

    if (errorMessage) {
      setErrorMessage("")
    }
  }

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    if (!isCardValid) {
      setErrorMessage("Please enter valid card details.")
      return
    }

    setIsProcessing(true)

    try {
      // const updatedReservation = await processPayment(
      //   currentReservationResponse.id
      // )

      const updatedReservation = await processPayment({
        reservationId: currentReservationResponse.id,
        amount: totalAmount,
        card: {
          holderName: cardDetails.name,
          cardNumber: cardDetails.number.replace(/\s/g, ""),
          expiry: cardDetails.expiry,
          cvc: cardDetails.cvc,
        },
      })

      if (!updatedReservation) {
        throw new Error("Reservation not found")
      }

      updateCurrentReservationResponse(updatedReservation)

      router.push(
        `/confirmation?reservationId=${updatedReservation.id}`
      )
    } catch (error) {
      console.error("Payment failed:", error)

      setErrorMessage(
        "Payment failed. Please try again."
      )
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="lg:sticky lg:top-24 h-fit">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Payment Details
          </CardTitle>

          <CardDescription>
            Enter your card details to confirm your reservation
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-4 w-4" />
                  Credit / Debit Card
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-4 pt-4 border-t">
                  {/* card holder */}
                  <div className="space-y-2">
                    <Label htmlFor="cardName">
                      Name on Card
                    </Label>

                    <Input
                      id="cardName"
                      name="name"
                      placeholder="John Doe"
                      value={cardDetails.name}
                      onChange={handleCardChange}
                    />
                  </div>

                  {/* card number */}
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">
                      Card Number
                    </Label>

                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                      <Input
                        id="cardNumber"
                        name="number"
                        placeholder="1234 5678 9012 3456"
                        className="pl-10"
                        value={cardDetails.number}
                        onChange={handleCardChange}
                      />
                    </div>
                  </div>

                  {/* expiry + cvc */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">
                        Expiry Date
                      </Label>

                      <Input
                        id="expiry"
                        name="expiry"
                        placeholder="MM/YY"
                        value={cardDetails.expiry}
                        onChange={handleCardChange}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cvc">
                        CVC
                      </Label>

                      <div className="relative">
                        <Input
                          id="cvc"
                          name="cvc"
                          placeholder="123"
                          value={cardDetails.cvc}
                          onChange={handleCardChange}
                        />

                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {errorMessage && (
              <p className="text-sm text-destructive">
                {errorMessage}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!isCardValid || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : totalAmount > 0 ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Pay ${totalAmount.toFixed(2)} & Confirm
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Reservation
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}