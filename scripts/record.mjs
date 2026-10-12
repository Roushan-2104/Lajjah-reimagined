// Frame-perfect, interactive showcase recording.
// The page runs on Playwright's virtual clock: every frame advances time by exactly 1/FPS. A scripted
// cursor (drawn into the page only for the recording) glides, hovers, drags and clicks; scroll follows an
// eased path; CSS transitions are stepped on the same clock. Each frame is captured, then ffmpeg encodes,
// so the video is smooth no matter how loaded the machine is.
//
// Usage: node scripts/record.mjs [--frames N] [--width 1920 --height 1080] [--fps 60] [--url http://127.0.0.1:5190/]
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const require = createRequire(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/cli/node_modules/x.js'))
const { chromium } = require('playwright-core')

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d }
const W = +arg('width', 1920), H = +arg('height', 1080), FPS = +arg('fps', 60)
const URL = arg('url', 'http://127.0.0.1:5190/?capture')
const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'recording')
const FRAMES = path.join(OUT, `frames-${W}x${H}-${arg('tag', 'full')}`)
fs.rmSync(FRAMES, { recursive: true, force: true })
fs.mkdirSync(FRAMES, { recursive: true })

const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) // easeInOutCubic
const lerp = (a, b, t) => a + (b - a) * t
const clamp01 = v => Math.min(1, Math.max(0, v))

// ---- the visible cursor + click ripple (recording only; animated on the page's rAF = virtual clock) ----
const CURSOR = () => {
  const mk = () => {
    const c = document.createElement('div')
    c.id = '__cur'
    c.innerHTML = '<i></i>'
    const s = document.createElement('style')
    s.textContent = `#__cur{position:fixed;left:0;top:0;width:36px;height:36px;margin:-18px 0 0 -18px;border:2.5px solid #F5EBDD;border-radius:50%;
      box-shadow:0 0 0 1.5px rgba(23,20,20,.55),0 6px 18px rgba(0,0,0,.35);pointer-events:none;z-index:2147483647;will-change:transform;transition:none}
      #__cur i{position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px;border-radius:50%;background:#D8AE62}
      .__rip{position:fixed;left:0;top:0;width:30px;height:30px;margin:-15px 0 0 -15px;border:2px solid #D8AE62;border-radius:50%;pointer-events:none;z-index:2147483646}`
    document.documentElement.append(s, c)
    let x = -100, y = -100, press = 0, target = 0
    const ripples = []
    addEventListener('mousemove', e => { x = e.clientX; y = e.clientY }, true)
    addEventListener('mousedown', e => {
      target = 1
      const r = document.createElement('div'); r.className = '__rip'; document.documentElement.append(r)
      ripples.push({ el: r, x: e.clientX, y: e.clientY, t: performance.now() })
    }, true)
    addEventListener('mouseup', () => { target = 0 }, true)
    let last = performance.now()
    const tick = now => {
      const dt = Math.min(64, now - last); last = now
      press += (target - press) * Math.min(1, dt / 70)
      c.style.transform = `translate(${x}px,${y}px) scale(${1 - press * 0.28})`
      c.style.background = `rgba(216,174,98,${press * 0.45})`
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i], k = (now - r.t) / 520
        if (k >= 1) { r.el.remove(); ripples.splice(i, 1); continue }
        r.el.style.transform = `translate(${r.x}px,${r.y}px) scale(${1 + k * 1.9})`
        r.el.style.opacity = String(1 - k)
      }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mk); else mk()
}

const browser = await chromium.launch({
  channel: 'chrome', headless: true,
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11', '--hide-scrollbars'],
})
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage()
await page.addInitScript(CURSOR)
await page.clock.install({ time: new Date('2026-10-12T10:00:00+05:30') })
await page.goto(URL, { waitUntil: 'load' })
await page.waitForLoadState('networkidle')
await page.evaluate(() => document.fonts.ready)
for (let i = 0; i < 3; i++) await page.clock.runFor(4)
await page.waitForTimeout(2500)
// install() lets virtual time keep flowing with the wall clock; pause it so ONLY runFor() moves time.
// Otherwise every slow screenshot leaks hundreds of ms into the 3D and it races.
await page.clock.pauseAt(await page.evaluate(() => Date.now()) + 50)
console.log('renderer:', await page.evaluate(() => {
  const gl = document.createElement('canvas').getContext('webgl2'); const e = gl && gl.getExtension('WEBGL_debug_renderer_info')
  return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'unknown'
}))

// ---- page geometry, measured once at the top ----
const G = await page.evaluate(() => {
  const top = s => { const e = document.querySelector(s); return e.getBoundingClientRect().top + scrollY }
  const story = document.querySelector('.story')
  return {
    vh: innerHeight, docH: document.documentElement.scrollHeight,
    storyTop: top('.story'), storyRun: story.offsetHeight - innerHeight,
    shopTop: top('#shop') - 60, shopEnd: top('#shop') + document.querySelector('#shop').offsetHeight - innerHeight,
    igTop: top('.ig') - 60, careTop: top('#care') - 60,
  }
})
const sp = p => G.storyTop + p * G.storyRun

// ---- scroll path: [time s, scrollY] with eased segments; repeated values are holds ----
const SCROLL = [
  [0, 0], [6.6, 0],
  [8.4, sp(0)], [12.4, sp(0.18)],          // धातु · two metals
  [14.4, sp(0.36)], [21.9, sp(0.6)],       // शिल्प · cut → engrave → oxidise → buff
  [23.7, sp(0.72)], [30.2, sp(1)],         // संग्रह · turntable
  [32.0, G.shopTop], [40.4, G.shopTop],    // shop: filters, add to bag, 3D viewer
  [43.4, G.shopEnd], [45.9, G.igTop], [46.5, G.igTop],
  [49.0, G.careTop], [50.8, G.docH - G.vh], [53.0, G.docH - G.vh],
]
const DURATION = SCROLL[SCROLL.length - 1][0]
const scrollAt = t => {
  for (let i = 0; i < SCROLL.length - 1; i++) {
    const [t0, y0] = SCROLL[i], [t1, y1] = SCROLL[i + 1]
    if (t <= t1) return Math.round(lerp(y0, y1, ease(clamp01((t - t0) / (t1 - t0)))))
  }
  return SCROLL[SCROLL.length - 1][1]
}

// ---- cursor path: [time, target]. target = [x,y] | 'orbit' | { sel, nth, dx, dy } (element centre, resolved when the move starts) ----
const orbit = t => [W * 0.62 + Math.cos(t * 0.8) * W * 0.12, H * 0.48 + Math.sin(t * 1.15) * H * 0.13]
const CUR = [
  [0, [W * 0.92, H * 0.95]],
  [1.0, 'orbit'],                                                // light follows the cursor over the 3D hero
  [3.2, [W * 0.74, H * 0.66]],                                   // onto the crescent's engraved centre
  [3.4, [W * 0.74, H * 0.66]], [5.4, [W * 0.86, H * 0.62]],      // slow, short drag (down/up below)
  [6.0, { sel: '.hero .btn-foil' }], [6.6, { sel: '.hero .btn-foil' }],   // hover "Shop the drop"
  [8.4, 'orbit'],                                                // through the story
  [32.0, { sel: '.chip', nth: 1 }], [32.3, { sel: '.chip', nth: 1 }],     // German silver
  [32.9, { sel: '.chip', nth: 2 }], [33.1, { sel: '.chip', nth: 2 }],     // 92.5 sterling
  [33.7, { sel: '.chip', nth: 0 }], [33.9, { sel: '.chip', nth: 0 }],     // All
  [34.5, { sel: '.btn-add', nth: 0 }], [34.7, { sel: '.btn-add', nth: 0 }], // add to bag
  [35.3, { sel: '.btn-add', nth: 1 }], [35.5, { sel: '.btn-add', nth: 1 }], // add second piece
  [36.1, { sel: '.card-3d', nth: 0 }], [36.3, { sel: '.card-3d', nth: 0 }], // view Ira in 3D
  [36.9, { sel: '.viewer-canvas', dx: -0.08 }], [37.0, { sel: '.viewer-canvas', dx: -0.08 }],
  [39.4, { sel: '.viewer-canvas', dx: 0.1, dy: -0.04 }],                    // gentle drag-rotate in the viewer
  [40.0, { sel: '.viewer-close' }], [40.2, { sel: '.viewer-close' }],       // close
  [40.6, 'orbit'],
  [50.8, { sel: '.glass-cta', dx: -0.12 }], [52.3, { sel: '.glass-cta', dx: 0.1 }], [53.0, { sel: '.glass-cta', dx: 0.1 }],
]
const CLICKS = [
  { at: 32.3, kind: 'click' }, { at: 33.1, kind: 'click' }, { at: 33.9, kind: 'click' },
  { at: 34.7, kind: 'click' }, { at: 35.5, kind: 'click' }, { at: 36.3, kind: 'click' },
  { at: 40.2, kind: 'click' },
  { at: 3.4, kind: 'down' }, { at: 5.4, kind: 'up' },
  { at: 37.0, kind: 'down' }, { at: 39.4, kind: 'up' },
]

async function resolve(target, t) {
  if (target === 'orbit') return orbit(t)
  if (Array.isArray(target)) return target
  const r = await page.evaluate(({ sel, nth = 0 }) => {
    const e = document.querySelectorAll(sel)[nth]; if (!e) return null
    const b = e.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]
  }, target)
  if (!r) return orbit(t)
  return [r[0] + r[2] * (0.5 + (target.dx || 0)), r[1] + r[3] * (0.5 + (target.dy || 0))]
}

const cdp = await page.context().newCDPSession(page)
const total = +arg('frames', Math.round(DURATION * FPS))
const from = Math.round(+arg('from', 0) * FPS) // fast-forward: simulate but don't capture frames before this time
let seg = -1, segFrom = null, segTo = null, pos = [W * 0.92, H * 0.95]
const done = new Set()
const t0 = Date.now()
for (let f = 0; f < total; f++) {
  const t = f / FPS
  const step = Math.round(((f + 1) * 1000) / FPS) - Math.round((f * 1000) / FPS) // whole ms, sums exactly to real time
  // cursor segment bookkeeping
  let i = 0
  while (i < CUR.length - 1 && t >= CUR[i + 1][0]) i++
  if (i !== seg) {
    seg = i
    segFrom = pos
    segTo = i + 1 < CUR.length ? await resolve(CUR[i + 1][1], CUR[i + 1][0]) : null
  }
  const [ta, tgtA] = CUR[i]
  if (tgtA === 'orbit' && (!segTo || i + 1 >= CUR.length)) pos = orbit(t)
  else if (tgtA === 'orbit' && segTo) {
    // orbit until 0.8 s before the next key, then ease from the orbit onto the next target
    const tb = CUR[i + 1][0]
    if (t < tb - 0.8) pos = orbit(t)
    else { const from = orbit(tb - 0.8); const k = ease(clamp01((t - (tb - 0.8)) / 0.8)); pos = [lerp(from[0], segTo[0], k), lerp(from[1], segTo[1], k)] }
  } else if (segTo) {
    const tb = CUR[i + 1][0]; const k = ease(clamp01((t - ta) / Math.max(0.001, tb - ta)))
    pos = [lerp(segFrom[0], segTo[0], k), lerp(segFrom[1], segTo[1], k)]
  }
  await page.mouse.move(pos[0], pos[1])
  for (const c of CLICKS) {
    if (done.has(c) || t < c.at) continue
    done.add(c)
    if (c.kind === 'down') await page.mouse.down()
    else if (c.kind === 'up') await page.mouse.up()
    else { await page.mouse.down(); await page.mouse.up() }
  }
  // scroll + step every CSS transition/animation on the virtual clock, so hovers animate smoothly
  await page.evaluate(({ y, ms }) => {
    window.scrollTo({ top: y, behavior: 'instant' })
    for (const a of document.getAnimations()) {
      if (a.__v === undefined) { a.pause(); a.__v = a.currentTime || 0 }
      a.__v += ms; a.currentTime = a.__v
    }
  }, { y: scrollAt(t), ms: step })
  await page.clock.runFor(step)
  if (f >= from) {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 })
    fs.writeFileSync(path.join(FRAMES, `f${String(f - from).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'))
  }
  if (f % 60 === 0) {
    const el = (Date.now() - t0) / 1000
    console.log(`frame ${f}/${total}  t=${t.toFixed(1)}s  elapsed ${el.toFixed(0)}s  eta ${((el / (f + 1)) * (total - f - 1)).toFixed(0)}s`)
  }
}
await browser.close()

const tag = arg('tag', 'full')
const mp4 = path.join(OUT, `lajjha-showcase-${W}x${H}-${FPS}fps${tag === 'full' ? '' : '-' + tag}.mp4`)
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, 'f%05d.jpg'),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' })
console.log('wrote', mp4)
