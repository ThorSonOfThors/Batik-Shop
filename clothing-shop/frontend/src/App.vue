<template>
  <Navbar />
  <div
    class="page-wrapper"
    @touchstart.passive="handleTouchStart"
    @touchend.passive="handleTouchEnd"
  >
  <router-view v-slot="{ Component }">
    <transition :name="transitionName">
      <div class="route-shell" :key="route.fullPath">
        <component :is="Component" />
      </div>
    </transition>
</router-view>

  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Navbar from './components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const transitionName = ref('slide-left')

/* ORDER MATTERS */
const pagesOrder = ['home', 'shop', 'cart' , 'admin' , 'Admin Orders']

let prevIndex = pagesOrder.indexOf(route.name as string)

/* SLIDE DIRECTION LOGIC */
watch(route, (to) => {
  const newIndex = pagesOrder.indexOf(to.name as string)

  if (newIndex > prevIndex) {
    transitionName.value = 'slide-left'
  } else {
    transitionName.value = 'slide-right'
  }

  prevIndex = newIndex
})

/* =========================
   MOBILE SWIPE NAVIGATION
========================= */

let startX = 0
let startY = 0
let endX = 0
let endY = 0

const minSwipeDistance = 80
const verticalLimit = 80

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches?.[0]
  if (!touch) return

  startX = touch.clientX
  startY = touch.clientY
}

function handleTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches?.[0]
  if (!touch) return

  endX = touch.clientX
  endY = touch.clientY

  handleSwipe()
}

function handleSwipe() {
  const diffX = endX - startX
  const diffY = Math.abs(endY - startY)

  /* Ignore vertical scroll */
  if (diffY > verticalLimit) return

  if (Math.abs(diffX) < minSwipeDistance) return

  const currentIndex = pagesOrder.indexOf(route.name as string)
  if (currentIndex === -1) return

  // Swipe LEFT → next
  if (diffX < 0 && currentIndex < pagesOrder.length - 1) {
    router.push({ name: pagesOrder[currentIndex + 1] })
  }

  // Swipe RIGHT → previous
  if (diffX > 0 && currentIndex > 0) {
    router.push({ name: pagesOrder[currentIndex - 1] })
  }
}
</script>

<style>
/* RESET */
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* ROOT */
html {
  scrollbar-gutter: stable;
  overflow-y: scroll;  
  overflow-x: hidden; 
}

body {
  margin: 0;
  font-family: Arial, sans-serif;
  overflow-x: hidden;
}

/* NAVBAR */
.navbar {
  position: sticky;
  top: 0;
  height: 55px;
  z-index: 100;
}

/* PAGE WRAPPER */
.page-wrapper {
  position: relative;
  padding-top: 55px; /* HEIGHT OF NAVBAR */
  min-height: 100vh;
  overflow: hidden;
  background: black;
  z-index: 0;
}

/* ROUTE VIEWS */
.page-wrapper > * {
  min-height: 100%;
}

/* TRANSITIONS */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.6s ease-in-out;
  position: absolute;
  width: 100%;
  left: 0;
}

/* The full-screen canvas that moves */


/* FORWARD */
.slide-left-enter-from {
  transform: translateX(100%);
}
.slide-left-leave-to {
  transform: translateX(-100%);
}

/* BACK */
.slide-right-enter-from {
  transform: translateX(-100%);
}
.slide-right-leave-to {
  transform: translateX(100%);
}



</style>
