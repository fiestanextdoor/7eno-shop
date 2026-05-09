'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/cart'

interface CartState {
  items: CartItem[]
  isCartOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (variantId: number) => void
  updateQuantity: (variantId: number, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (item) => {
        const existing = get().items.find((i) => i.variantId === item.variantId)
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          }))
        } else {
          set((state) => ({ items: [...state.items, item] }))
        }
      },

      removeItem: (variantId) => {
        set((state) => ({
          items: state.items.filter((i) => i.variantId !== variantId),
        }))
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.variantId === variantId ? { ...i, quantity } : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isCartOpen: true }),

      closeCart: () => set({ isCartOpen: false }),

      total: () => {
        return get().items.reduce(
          (sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity,
          0
        )
      },

      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: '7eno-cart',
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    }
  )
)
