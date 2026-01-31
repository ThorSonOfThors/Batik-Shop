import { defineStore } from 'pinia'

export const useBackgroundStore = defineStore('background', {
  state: () => ({
    bgIndex: Number(localStorage.getItem('bgIndex') ?? 0),
    timer: null as number | null
  }),

  actions: {
    setBackground(index: number) {
      this.bgIndex = index
      localStorage.setItem('bgIndex', String(index))
    },

    startRotation(total: number) {
      // Kill any old timers
      this.stopRotation()

      this.timer = window.setInterval(() => {

        const next =
          (Number(this.bgIndex) + 1) % total

        this.bgIndex = next
        localStorage.setItem('bgIndex', String(next))

      }, 30000)
    },

    stopRotation() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    }
  },

  persist: true
})
