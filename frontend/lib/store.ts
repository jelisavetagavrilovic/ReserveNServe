// "use client"

// import { create } from "zustand"
// import { persist } from "zustand/middleware"
// import type { User, CartItem, Table } from "./types"
// import type { ReservationRequest, ReservationResponse } from "./types/reservation.types"

// interface AppState {
//   // user
//   user: User | null
//   setUser: (user: User) => void
//   logout: () => void

//   // table
//   selectedTable: Table | null
//   setSelectedTable: (table: Table | null) => void

//   // cart
//   cart: CartItem[]
//   addToCart: (item: CartItem) => void
//   removeFromCart: (itemId: number) => void
//   updateCartItemQuantity: (itemId: number, quantity: number) => void
//   clearCart: () => void
//   getCartTotal: () => number

//   // reservation
//   // currentReservation: Reservation | null
//   // setCurrentReservation: (reservation: Reservation | null) => void
//   // updateCurrentReservation: (updates: Partial<Reservation>) => void
//   // todo: replace with API call - don't need me
//   // reservations: Reservation[]
//   // addReservation: (reservation: Reservation) => void
//   // cancelReservation: (id: number) => void

//   currentReservationRequest: ReservationRequest | null
//   setCurrentReservationRequest: (reservation: ReservationRequest | null) => void
//   updateCurrentReservationRequest: (updates: Partial<ReservationRequest>) => void

//   currentReservationResponse: ReservationResponse | null
//   setCurrentReservationResponse: (reservation: ReservationResponse | null) => void
//   updateCurrentReservationResponse: (updates: Partial<ReservationResponse>) => void
// }

// export const useAppStore = create<AppState>()(
//   persist(
//     (set, get) => ({
//       // user
//       user: null,
//       setUser: (user) => set({ user: user }),
//       logout: () => set({ user: null }),

//       // table
//       selectedTable: null,
//       setSelectedTable: (table) => set({ selectedTable: table }),

//       // cart
//       cart: [],
//       addToCart: (item) => {
//         const cart = get().cart
//         const existing = cart.find((i) => i.id === item.id)
//         if (existing) {
//           set({
//             cart: cart.map((i) =>
//               i.id === item.id
//                 ? { ...i, quantity: i.quantity + item.quantity }
//                 : i
//             ),
//           })
//         } else {
//           set({ cart: [...cart, item] })
//         }
//       },
//       removeFromCart: (itemId) =>
//         set((state) => ({
//           cart: state.cart.filter((i) => i.id !== itemId),
//         })),
//       updateCartItemQuantity: (itemId, quantity) => {
//         if (quantity <= 0) {
//           get().removeFromCart(itemId)
//         } else {
//           set((state) => ({
//             cart: state.cart.map((i) =>
//               i.id === itemId ? { ...i, quantity } : i
//             ),
//           }))
//         }
//       },
//       clearCart: () => set({ cart: [] }),
//       getCartTotal: () =>
//         get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),

//       // reservation request
//       currentReservationRequest: null,
//       setCurrentReservationRequest: (reservation) => 
//         set({ currentReservationRequest: reservation }),
//       updateCurrentReservationRequest: (updates) => {
//         const { currentReservationRequest } = get()
//         if (!currentReservationRequest) return
//         set({ 
//           currentReservationRequest: { 
//             ...currentReservationRequest, 
//             ...updates 
//           } 
//         })
//       },
//       // reservation response
//       currentReservationResponse: null,
//       setCurrentReservationResponse: (reservation) => 
//         set({ currentReservationResponse: reservation }),
//       updateCurrentReservationResponse: (updates) => {
//         const { currentReservationResponse } = get()
//         if (!currentReservationResponse) return
//         set({ 
//           currentReservationResponse: {
//             ...currentReservationResponse, 
//             ...updates 
//           } 
//         })
//       }

//       // reservations: [],
//       // addReservation: (reservation) => {
//       //   set((state) => ({
//       //     reservations: [...state.reservations, reservation],
//       //   }))
//       // },
//       // cancelReservation: (id) => {
//       //   set((state) => ({
//       //     reservations: state.reservations.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r)),
//       //   }))
//       // },
//     }),
//     {
//       name: "restaurant-app-storage",
//       partialize: (state) => ({
//         user: state.user,
//         cart: state.cart,
//         selectedTable: state.selectedTable,
//         // reservations: state.reservations, // tmp
//         currentReservationRequest: state.currentReservationRequest,
//         currentReservationResponse: state.currentReservationResponse,
//       }),
//       // refresh
//       onRehydrateStorage: () => (state) => {
//         console.log("hydrated store", state)
//       },
//     }
//   )
// )


"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { User } from "@/auth/types/auth.types"
import type {
  ReservationRequest,
  ReservationResponse,
} from "@/lib/types/reservation.types"
import type {
  Table,
  MenuItem,
} from "@/lib/types/restaurant.types"
import type {
  CartItem,
} from "@/lib/types/cart.types"

interface AppState {
  // auth
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void

  // reservation flow
  selectedTable: Table | null
  setSelectedTable: (table: Table | null) => void

  currentReservationRequest: ReservationRequest | null
  setCurrentReservationRequest: (
    reservation: ReservationRequest | null
  ) => void
  updateCurrentReservationRequest: (
    updates: Partial<ReservationRequest>
  ) => void

  currentReservationResponse: ReservationResponse | null
  setCurrentReservationResponse: (
    reservation: ReservationResponse | null
  ) => void
  updateCurrentReservationResponse: (
    updates: Partial<ReservationResponse>
  ) => void

  clearReservationFlow: () => void

  // cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: number) => void
  updateCartItemQuantity: (
    itemId: number,
    quantity: number
  ) => void
  clearCart: () => void
  getCartTotal: () => number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // AUTH
      user: null,

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          user: null,
          selectedTable: null,
          cart: [],
          currentReservationRequest: null,
          currentReservationResponse: null,
        }),

      // TABLE
      selectedTable: null,

      setSelectedTable: (table) =>
        set({ selectedTable: table }),

      // RESERVATION REQUEST
      currentReservationRequest: null,

      setCurrentReservationRequest: (reservation) =>
        set({
          currentReservationRequest: reservation,
        }),

      updateCurrentReservationRequest: (updates) => {
        const current = get().currentReservationRequest

        if (!current) return

        set({
          currentReservationRequest: {
            ...current,
            ...updates,
          },
        })
      },

      // RESERVATION RESPONSE
      currentReservationResponse: null,

      setCurrentReservationResponse: (reservation) =>
        set({
          currentReservationResponse: reservation,
        }),

      updateCurrentReservationResponse: (updates) => {
        const current = get().currentReservationResponse

        if (!current) return

        set({
          currentReservationResponse: {
            ...current,
            ...updates,
          },
        })
      },

      // CLEAR FLOW
      clearReservationFlow: () =>
        set({
          selectedTable: null,
          cart: [],
          currentReservationRequest: null,
          currentReservationResponse: null,
        }),

      // CART
      cart: [],

      addToCart: (item) => {
        const existing = get().cart.find(
          (i) => i.id === item.id
        )

        if (existing) {
          set((state) => ({
            cart: state.cart.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    quantity:
                      i.quantity + item.quantity,
                  }
                : i
            ),
          }))
        } else {
          set((state) => ({
            cart: [...state.cart, item],
          }))
        }
      },

      removeFromCart: (itemId) =>
        set((state) => ({
          cart: state.cart.filter(
            (i) => i.id !== itemId
          ),
        })),

      updateCartItemQuantity: (
        itemId,
        quantity
      ) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId)
          return
        }

        set((state) => ({
          cart: state.cart.map((i) =>
            i.id === itemId
              ? { ...i, quantity }
              : i
          ),
        }))
      },

      clearCart: () => set({ cart: [] }),

      getCartTotal: () =>
        get().cart.reduce(
          (sum, item) =>
            sum + item.price * item.quantity,
          0
        ),
    }),
    {
      name: "restaurant-app-storage",

      partialize: (state) => ({
        user: state.user,
        selectedTable: state.selectedTable,
        cart: state.cart,
        currentReservationRequest:
          state.currentReservationRequest,
        currentReservationResponse:
          state.currentReservationResponse,
      }),
    }
  )
)