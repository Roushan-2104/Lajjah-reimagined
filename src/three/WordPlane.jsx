import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'

/**
 * A word drawn on a 2D canvas and placed in 3D. The browser's text engine shapes Devanagari
 * conjuncts (ज्जा, ल्प) correctly, which troika/SDF text in three.js does not.
 */
export function WordPlane({ text, font = "'Tiro Devanagari Marathi'", color = '#D8AE62', stroke = null, weight = 0.022, height = 2, opacity = 1, ...props }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    const f = `400 200px ${font}`
    ;(document.fonts?.load(f, text) ?? Promise.resolve()).then(() => alive && setReady(true))
    return () => { alive = false }
  }, [font, text])

  const { texture, aspect } = useMemo(() => {
    const px = 360
    const c = document.createElement('canvas')
    const g = c.getContext('2d')
    g.font = `400 ${px}px ${font}, 'Noto Serif Devanagari', serif`
    const w = Math.ceil(g.measureText(text).width) + px * 0.4
    c.width = w; c.height = Math.ceil(px * 1.55)
    g.font = `400 ${px}px ${font}, 'Noto Serif Devanagari', serif`
    g.textBaseline = 'middle'; g.textAlign = 'center'
    g.lineJoin = 'round'
    if (weight && color) { g.lineWidth = px * weight; g.strokeStyle = color; g.strokeText(text, w / 2, c.height * 0.56) }
    if (stroke) { g.lineWidth = px * 0.012; g.strokeStyle = stroke; g.strokeText(text, w / 2, c.height * 0.56) }
    if (color) { g.fillStyle = color; g.fillText(text, w / 2, c.height * 0.56) }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return { texture: t, aspect: w / c.height }
  }, [text, font, color, stroke, weight, ready])

  return (
    <mesh {...props}>
      <planeGeometry args={[height * aspect, height]} />
      <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </mesh>
  )
}
