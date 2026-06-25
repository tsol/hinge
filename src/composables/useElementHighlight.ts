import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

export function useElementHighlight(element: Ref<Element | null>) {
  const rect = ref<DOMRect | null>(null)

  function update() {
    const el = element.value
    if (!el || !el.isConnected) {
      rect.value = null
      return
    }
    rect.value = el.getBoundingClientRect()
  }

  watch(element, update, { flush: 'sync' })

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    window.visualViewport?.addEventListener('resize', update)
    window.visualViewport?.addEventListener('scroll', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('scroll', update, true)
    window.visualViewport?.removeEventListener('resize', update)
    window.visualViewport?.removeEventListener('scroll', update)
  })

  return { rect, update }
}
