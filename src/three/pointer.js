// Shared pointer state for all depth plates (-1..1 across the viewport).
export const pointer = { x: 0, y: 0, active: false }
let idleTimer
const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
export const reducedMotion = () => !!mq?.matches

if (typeof window !== 'undefined') {
  const move = (cx, cy) => {
    pointer.x = (cx / window.innerWidth) * 2 - 1
    pointer.y = (cy / window.innerHeight) * 2 - 1
    pointer.active = true
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => (pointer.active = false), 2500)
  }
  window.addEventListener('pointermove', e => move(e.clientX, e.clientY), { passive: true })
  window.addEventListener('touchmove', e => { const t = e.touches[0]; if (t) move(t.clientX, t.clientY) }, { passive: true })
}
