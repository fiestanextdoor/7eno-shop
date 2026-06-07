'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '@/types/cart'
import { cartItemKey } from '@/lib/cart-key'

interface CartState {
  items: CartItem[]
  isCartOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  total: () => number
  itemCount: () => number
}

const keyOf = (i: CartItem) => cartItemKey(i.provider, i.variantId, i.bundleId, i.productId)

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (item) => {
        const key = keyOf(item)
        const existing = get().items.find((i) => keyOf(i) === key)
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              keyOf(i) === key ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          }))
        } else {
          set((state) => ({ items: [...state.items, item] }))
        }
      },

      removeItem: (key) => {
        set((state) => ({ items: state.items.filter((i) => keyOf(i) !== key) }))
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key)
          return
        }
        set((state) => ({
          items: state.items.map((i) => (keyOf(i) === key ? { ...i, quantity } : i)),
        }))
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),

      total: () =>
        get().items.reduce((sum, item) => sum + (parseFloat(item.price) || 0) * item.quantity, 0),

      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      // Bumped to v2: the CartItem shape changed (provider + string ids), so old
      // persisted carts are dropped rather than rehydrated into the new shape.
      name: '7eno-cart-v2',
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
      migrate: () => ({ items: [] as CartItem[] }),
      version: 2,
    }
  )
)
