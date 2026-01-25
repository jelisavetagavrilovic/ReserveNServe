"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { CartItem, Table } from "./types"

interface AppState {
  // selected table
  selectedTable: Table | null
  setSelectedTable: (table: Table | null) => void

  // cart management
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (itemId: number) => void
  updateCartItemQuantity: (itemId: number, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // cart state
      cart: [],
      addToCart: (item) => {
        const { cart } = get()
        const existingItem = cart.find((i) => i.id === item.id)
        if (existingItem) {
          set({
            cart: cart.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)),
          })
        } else {
          set({ cart: [...cart, item] })
        }
      },
      removeFromCart: (itemId) => {
        set((state) => ({ cart: state.cart.filter((i) => i.id !== itemId) }))
      },
      updateCartItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId)
        } else {
          set((state) => ({
            cart: state.cart.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
          }))
        }
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        const { cart } = get()
        return cart.reduce((total, item) => total + item.price * item.quantity, 0)
      },

      // selected table
      selectedTable: null,
      setSelectedTable: (table) => set({ selectedTable: table }),
    }),
    {
      name: "restaurant-app-storage",
      partialize: (state) => ({
      }),
    },
  ),
)
