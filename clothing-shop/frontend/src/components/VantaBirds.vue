<template>
  <div ref="vantaRef" class="vanta-bg"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import BIRDS from 'vanta/dist/vanta.birds.min'

const vantaRef = ref<HTMLElement | null>(null)
let effect: any = null

onMounted(() => {
  if (!vantaRef.value) return

  effect = BIRDS({
    el: vantaRef.value,
    THREE,
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    backgroundAlpha: 0.0, // VERY IMPORTANT
    scale: 1.0,
    scaleMobile: 1.0
  })
})

onBeforeUnmount(() => {
  effect?.destroy()
})
</script>

<style>

    #vanta-root {
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
}

.vanta-bg {
  position: fixed;
  inset: 0;
  z-index: 0; /* NOT negative */
  pointer-events: none;
}
</style>
