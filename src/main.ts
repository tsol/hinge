import { createApp } from 'vue'
import Hinge from './Hinge.vue'

export function mountHinge(selector = 'body'): void {
  const target = document.querySelector(selector)
  if (!target) {
    console.warn(`[hinge] mount target "${selector}" not found`)
    return
  }
  const root = document.createElement('div')
  root.className = 'hinge-mount'
  Object.assign(root.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '0',
    height: '0',
    overflow: 'visible',
    pointerEvents: 'none',
    zIndex: '99997',
  })
  target.appendChild(root)
  createApp(Hinge).mount(root)
}
