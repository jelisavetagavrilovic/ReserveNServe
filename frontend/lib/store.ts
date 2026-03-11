"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, CartItem, Reservation, Table } from "./types"
import { ReservationRequest, OrderRequest, ReservationResponse } from "./types/reservation.types"

interface AppState {
  // user
  user: User | null
  setUser: (user: User) => void
  logout: () => void

  // table
  selectedTable: Table | null
  setSelectedTable: (table: Table | null) => void

  // cart
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: number) => void
  updateCartItemQuantity: (itemId: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number

  // reservation
  // currentReservation: Reservation | null
  // setCurrentReservation: (reservation: Reservation | null) => void
  // updateCurrentReservation: (updates: Partial<Reservation>) => void
  // todo: replace with API call - don't need me
  // reservations: Reservation[]
  // addReservation: (reservation: Reservation) => void
  // cancelReservation: (id: number) => void

  currentReservationRequest: ReservationRequest | null
  setCurrentReservationRequest: (reservation: ReservationRequest | null) => void
  updateCurrentReservationRequest: (updates: Partial<ReservationRequest>) => void

  currentReservationResponse: ReservationResponse | null
  setCurrentReservationResponse: (reservation: ReservationResponse | null) => void
  updateCurrentReservationResponse: (updates: Partial<ReservationResponse>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // user
      user: null,
      setUser: (user) => set({ user: user }),
      logout: () => set({ user: null }),

      // table
      selectedTable: null,
      setSelectedTable: (table) => set({ selectedTable: table }),

      // cart
      cart: [],
      addToCart: (item) => {
        const cart = get().cart
        const existing = cart.find((i) => i.id === item.id)
        if (existing) {
          set({
            cart: cart.map((i) =>
              i.id === item.id
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ cart: [...cart, item] })
        }
      },
      removeFromCart: (itemId) =>
        set((state) => ({
          cart: state.cart.filter((i) => i.id !== itemId),
        })),
      updateCartItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId)
        } else {
          set((state) => ({
            cart: state.cart.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            ),
          }))
        }
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () =>
        get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0),

      // reservation request
      currentReservationRequest: null,
      setCurrentReservationRequest: (reservation) => 
        set({ currentReservationRequest: reservation }),
      updateCurrentReservationRequest: (updates) => {
        const { currentReservationRequest } = get()
        if (!currentReservationRequest) return
        set({ 
          currentReservationRequest: { 
            ...currentReservationRequest, 
            ...updates 
          } 
        })
      },
      // reservation response
      currentReservationResponse: null,
      setCurrentReservationResponse: (reservation) => 
        set({ currentReservationResponse: reservation }),
      updateCurrentReservationResponse: (updates) => {
        const { currentReservationResponse } = get()
        if (!currentReservationResponse) return
        set({ 
          currentReservationResponse: {
            ...currentReservationResponse, 
            ...updates 
          } 
        })
      }

      // reservations: [],
      // addReservation: (reservation) => {
      //   set((state) => ({
      //     reservations: [...state.reservations, reservation],
      //   }))
      // },
      // cancelReservation: (id) => {
      //   set((state) => ({
      //     reservations: state.reservations.map((r) => (r.id === id ? { ...r, status: "cancelled" as const } : r)),
      //   }))
      // },
    }),
    {
      name: "restaurant-app-storage",
      partialize: (state) => ({
        user: state.user,
        cart: state.cart,
        selectedTable: state.selectedTable,
        // reservations: state.reservations, // tmp
        currentReservationRequest: state.currentReservationRequest,
        currentReservationResponse: state.currentReservationResponse,
      }),
      // refresh
      onRehydrateStorage: () => (state) => {
        console.log("hydrated store", state)
      },
    }
  )
)
