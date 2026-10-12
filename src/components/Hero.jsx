import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { HeroScene, hero } from '../three/HeroScene.jsx'
import { useFrameloop } from '../three/useFrameloop.js'

const IMG = import.meta.env.BASE_URL + 'img/'
const RIBBON = ['हस्तनिर्मित', 'Handcrafted', 'जर्मन सिल्वर', 'German silver', 'चाँदी 92.5', 'Sterling', 'सिलीगुड़ी', 'Siliguri', 'लज्जा', 'Not obedient']
const isDev = w => /[ऀ-ॿ]/.test(w)

export function Hero() {
  const el = useRef(null)
  const frameloop = useFrameloop(el)
  useEffect(() => {
    const on = () => {
      const r = el.current?.getBoundingClientRect()
      if (!r) return
      hero.p = Math.min(1, Math.max(0, -r.top / r.height))
      el.current.style.setProperty('--ribbon', String(Math.round(window.scrollY * 0.6)))
    }
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <header className="hero" ref={el} id="top">
      <div className="hero-canvas">
        <Canvas frameloop={frameloop} dpr={[1, 1.75]} camera={{ fov: 35, position: [0, 0.1, 7] }} gl={{ antialias: true, alpha: true }}
          fallback={<img className="hero-fallback" src={`${IMG}tray.webp`} alt="" />}>
          <Suspense fallback={null}><HeroScene /></Suspense>
        </Canvas>
      </div>

      <div className="hero-copy">
        <p className="hero-kicker"><span lang="hi" className="dev">हाथ से बना · हाथ से काला</span><span className="label">Made by hand · blackened by hand</span></p>
        <h1 className="hero-title"><span className="t-serif">Oxidised.</span><span className="t-grot">Not obedient.</span></h1>
        <p className="hero-sub">German silver &amp; 92.5 statement pieces, cut, engraved and oxidised in one studio in Siliguri.</p>
        <div className="hero-buy">
          <a href="#shop" className="btn btn-foil">Shop the drop</a>
          <span className="label hero-price">From ₹1,349</span>
        </div>
        <ul className="trust label" aria-label="Why buy from Lajjha">
          <li>Handmade in Siliguri</li><li>Cash on delivery</li><li>7-day exchange</li><li>500+ orders shipped</li>
        </ul>
      </div>
      <p className="hero-drag label" aria-hidden="true">Drag the crescent ↻</p>

      <div className="ribbon" aria-hidden="true">
        <div className="ribbon-track">
          {[0, 1].map(k => <span key={k}>{RIBBON.map((w, i) => <b key={i} className={isDev(w) ? 'dev' : 'label'}>{w}</b>)}</span>)}
        </div>
      </div>
    </header>
  )
}
