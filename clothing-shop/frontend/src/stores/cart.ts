import { defineStore } from 'pinia'
import type { Item } from '@/types/Item'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as Item[],
    taxRate: 0.08, //8% tax
  }),

  getters: {
    totalItems: (state) => state.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
    totalPrice: (state) =>
      state.items.reduce((sum, item) => sum + (item.price * (item.quantity ?? 1)), 0),
    
    getTax: (state): number => Number.parseFloat(state.taxRate.toString()),
    
  },

  actions: {
    addToCart(item: Item) {
      const existing = this.items.find(i => i.id === item.id)
      if (existing) {
        existing.quantity = (existing.quantity ?? 1) + 1
      } else {
        this.items.push({ ...item, quantity: 1 })
      }
    },

    removeFromCart(itemId: number) {
      this.items = this.items.filter(i => i.id !== itemId)
    },

    updateQuantity(itemId: number, quantity: number) {
      const item = this.items.find(i => i.id === itemId)
      if (item) item.quantity = quantity
    },

    clearCart() {
      this.items = []
    },
  },

  persist: true, // ✅ if using persisted state
})
