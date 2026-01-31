import * as THREE from 'three'
import BIRDS from 'vanta/dist/vanta.birds.min'

export type VantaInstance = {
  destroy: () => void
}

export function initVanta(el: HTMLElement): VantaInstance {
  const instance = BIRDS({
    el,
    THREE,

    // interaction
    mouseControls: true,
    touchControls: true,
    gyroControls: false,

    // layout / scaling
    minHeight: 200.0,
    minWidth: 200.0,
    scale: 1.0,
    scaleMobile: 1.0,

    // colors
    backgroundColor: 0x000000,
    color1: 0x000000,
    color2: 0xac006f,

    // birds behavior
    birdSize: 1.3,
    wingSpan: 33.0,
    speedLimit: 3.0,
    alignment: 64.0,
    cohesion: 33.0,
  })

  return instance as VantaInstance
}
