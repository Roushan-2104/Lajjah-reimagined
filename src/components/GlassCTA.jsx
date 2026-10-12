import { useEffect, useRef, useState } from 'react'
import '../vendor/liquid-glass/glass.css'

/**
 * liquid-glass-js pills. The library snapshots the page with html2canvas and refracts it,
 * so they are mounted only when the (static, non-WebGL) closing section is near.
 * Falls back to plain links if WebGL2 is missing or the snapshot fails.
 */
export function GlassCTA({ items }) {
  const host = useRef(null)
  const [mode, setMode] = useState('links') // 'links' until glass mounts
  useEffect(() => {
    const el = host.current
    const gl2 = !!document.createElement('canvas').getContext('webgl2')
    if (!el || !gl2) return
    let buttons = []
    const io = new IntersectionObserver(async ([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      await document.fonts?.ready
      const { Button } = await import('../vendor/liquid-glass/button.js')
      // stronger than the library defaults so the refraction reads over busy photos
      window.glassControls = { edgeIntensity: 0.03, rimIntensity: 0.14, baseIntensity: 0.025, edgeDistance: 0.22, rimDistance: 0.9, baseDistance: 0.14, cornerBoost: 0.05, rippleEffect: 0.14, blurRadius: 14 }
      Button.fontCss = s => `700 ${s}px Manrope, sans-serif`
      buttons = items.map(it => new Button({
        text: it.label.toUpperCase(), size: window.innerWidth < 640 ? 18 : 28, type: 'pill', tintOpacity: 0.18,
        onClick: () => window.open(it.href, it.href.startsWith('#') ? '_self' : '_blank', 'noopener'),
      }))
      buttons.forEach((b, i) => {
        b.element.setAttribute('role', 'link')
        b.element.setAttribute('tabindex', '0')
        b.element.setAttribute('aria-label', items[i].label)
        b.element.addEventListener('keydown', ev => { if (ev.key === 'Enter') b.element.click() })
        el.appendChild(b.element)
      })
      setMode('glass')
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => { io.disconnect(); buttons.forEach(b => b.element.remove()) }
  }, [items])

  return (
    <div className={'glass-cta ' + mode} ref={host} data-glass-host>
      {mode === 'links' && items.map(it => (
        <a key={it.label} className="btn-ink" href={it.href} target={it.href.startsWith('#') ? undefined : '_blank'} rel="noreferrer">{it.label}</a>
      ))}
    </div>
  )
}
