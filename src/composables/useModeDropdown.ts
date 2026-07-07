import { ref, nextTick, type Ref } from 'vue'

export function useModeDropdown(
  anchorRef: Ref<HTMLElement | null>,
  itemCount: number,
  itemHeight = 34,
  padding = 42,
) {
  const open = ref(false)
  const opensUpward = ref(false)

  function toggle() {
    open.value = !open.value
    if (open.value) {
      nextTick(() => {
        const el = anchorRef.value
        if (!el) return
        const rect = el.getBoundingClientRect()
        const dropdownH = padding + itemCount * itemHeight
        opensUpward.value = rect.bottom + dropdownH + 8 > window.innerHeight
      })
    }
  }

  function close() {
    open.value = false
  }

  function onOutsideClick(e: MouseEvent, containerSelector: string) {
    const target = e.target as HTMLElement
    if (!target.closest(containerSelector)) {
      close()
    }
  }

  return { open, opensUpward, toggle, close, onOutsideClick }
}
