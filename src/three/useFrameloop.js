import { useEffect, useState } from 'react'

/** 'always' while the element is on screen, 'never' otherwise: off-screen WebGL canvases stop rendering. */
export function useFrameloop(ref, margin = '0px') {
  const [loop, setLoop] = useState('always')
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setLoop(e.isIntersecting ? 'always' : 'never'), { rootMargin: margin })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, margin])
  return loop
}
