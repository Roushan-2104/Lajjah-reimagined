import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { StoryScene, story } from '../three/StoryScene.jsx'
import { useFrameloop } from '../three/useFrameloop.js'
import { MODELS } from '../three/jewellery.js'
import { archive, inr } from '../data.js'

// [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd] in story progress
const WINDOWS = { metal: [-1, -1, 0.21, 0.27], making: [0.32, 0.37, 0.58, 0.64], archive: [0.67, 0.72, 2, 2] }
const vis = ([a, b, c, d], p) => (p < a ? 0 : p < b ? (p - a) / (b - a) : p < c ? 1 : p < d ? 1 - (p - c) / (d - c) : 0)
const STEPS = [
  ['काटना', 'Cut', 'Sheet and wire, cut and forged'],
  ['नक्काशी', 'Engrave', 'Motifs chased by hand'],
  ['काला', 'Oxidise', 'The whole piece goes black'],
  ['चमक', 'Buff', 'High points rubbed back to silver'],
]

export function Story() {
  const wrap = useRef(null), panes = useRef({}), steps = useRef([]), front = useRef(null)
  const frameloop = useFrameloop(wrap)
  useEffect(() => {
    let raf, lastFront = '', lastStage = -1
    const tick = () => {
      const el = wrap.current
      if (el) {
        const r = el.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, el.offsetHeight - window.innerHeight)))
        story.p = p
        for (const [k, w] of Object.entries(WINDOWS)) {
          const n = panes.current[k]
          if (!n) continue
          const o = vis(w, p)
          n.style.opacity = o.toFixed(3)
          n.style.transform = `translateY(${(1 - o) * 20}px)`
          n.style.visibility = o < 0.02 ? 'hidden' : 'visible'
        }
        if (story.stage !== lastStage) {
          lastStage = story.stage
          steps.current.forEach((s, i) => s && s.classList.toggle('is-on', i === lastStage))
        }
        if (story.front !== lastFront && front.current) {
          lastFront = story.front
          const m = MODELS[lastFront], item = archive.find(a => a.model === lastFront)
          front.current.innerHTML = `<span class="dev">${m.hi}</span><b>${m.name}</b><span class="label">${m.metal} · ${item ? inr(item.price) : ''}</span>`
        }
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <section className="story" ref={wrap} id="story" aria-label="The Lajjha story">
      <div className="story-stage">
        <Canvas className="story-canvas" frameloop={frameloop} dpr={[1, 1.6]} camera={{ fov: 35, position: [-1.9, 0, 7.4] }} gl={{ antialias: true }}>
          <Suspense fallback={null}><StoryScene /></Suspense>
        </Canvas>

        <div className="pane" ref={n => (panes.current.metal = n)}>
          <p className="pane-dev dev" lang="hi">धातु</p>
          <h2 className="display pane-title">Two metals.<br /><span className="em">Zero plating.</span></h2>
          <div className="metal-cols">
            <div><h3 className="label">German silver · from ₹1,349</h3><p>Copper, nickel and zinc. No silver in it, and we say so. Cool grey, deep black recesses. Contains nickel.</p></div>
            <div><h3 className="label">92.5 sterling · from ₹1,999</h3><p>92.5% silver, hallmarked, nickel-free. Bright white with hand-oxidised detail.</p></div>
          </div>
        </div>

        <div className="pane" ref={n => (panes.current.making = n)}>
          <p className="pane-dev dev" lang="hi">शिल्प</p>
          <h2 className="display pane-title">Made in one studio.<br /><span className="em">Watch it happen.</span></h2>
          <ol className="process">
            {STEPS.map(([hi, en, d], i) => (
              <li key={en} ref={n => (steps.current[i] = n)}><span className="dev">{hi}</span><b>{en}</b><span>{d}</span></li>
            ))}
          </ol>
          <p className="label pane-sign">Lajjha by Preeti Maurya · Est. 2019 · Reborn 2026</p>
        </div>

        <div className="pane" ref={n => (panes.current.archive = n)}>
          <p className="pane-dev dev" lang="hi">संग्रह</p>
          <h2 className="display pane-title">Spin the<br /><span className="em">archive.</span></h2>
          <p className="front-piece" ref={front} aria-live="polite" />
          <a className="btn btn-foil" href="#shop">See all 11 pieces</a>
        </div>
      </div>
    </section>
  )
}
