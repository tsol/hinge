import { reactive, watch, type Ref, onUnmounted } from 'vue'

export interface Point {
  x: number
  y: number
}

/**
 * Spring-damper smooth follow for "cartoonish inertia" feel.
 *
 * Each frame:
 *   velocity += (target - current) * stiffness - velocity * damping
 *   current += velocity
 *
 * rAF runs only while not settled. Settled = near target + near-zero velocity.
 * On target change → watch restarts rAF automatically.
 *
 * @param target  A Ref<Point> (e.g. a computed) that tracks the target position.
 * @param stiffness  Pull strength toward target   (default 0.04)
 * @param damping    Velocity resistance            (default 0.12, lower = bouncier)
 */
export function useSmoothFollow(
  target: Ref<Point>,
  stiffness = 0.04,
  damping = 0.12,
) {
  const t = target.value
  const current = reactive<Point>({ x: t.x, y: t.y })
  const vel = { x: 0, y: 0 }
  let raf: number | null = null
  let lastTime = 0

  function tick(now: number) {
    const t = target.value
    const dt = lastTime ? Math.min((now - lastTime) / 16, 2) : 1 // normalize to 60fps, cap at 2
    lastTime = now

    const dx = t.x - current.x
    const dy = t.y - current.y

    // Settled: stopped near target
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 &&
        Math.abs(vel.x) < 0.3 && Math.abs(vel.y) < 0.3) {
      current.x = t.x
      current.y = t.y
      vel.x = 0
      vel.y = 0
      raf = null
      return
    }

    // Spring force (frame-rate independent)
    vel.x += (dx * stiffness - vel.x * damping) * dt
    vel.y += (dy * stiffness - vel.y * damping) * dt

    // Clamp velocity to prevent instability on large jumps
    vel.x = Math.max(-20, Math.min(vel.x, 20))
    vel.y = Math.max(-20, Math.min(vel.y, 20))

    current.x += vel.x * dt
    current.y += vel.y * dt

    raf = requestAnimationFrame(tick)
  }

  // Restart rAF whenever target moves (and it's not already running)
  watch(
    () => target.value.x + target.value.y,
    () => {
      if (!raf) {
        lastTime = 0
        raf = requestAnimationFrame(tick)
      }
    },
  )

  function stop() {
    if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
  }

  function snap() {
    const t = target.value
    current.x = t.x
    current.y = t.y
    vel.x = 0
    vel.y = 0
  }

  onUnmounted(stop)

  return { current, stop, snap }
}
