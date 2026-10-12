// Wraps the showcase recording in a browser window, so it reads as a screen recording of the site.
// Renders the window chrome + wallpaper (bg.png) and a rounded content mask (mask.png) with Playwright,
// then composites with ffmpeg: wallpaper/chrome underneath, the recording masked into the content area.
//
// Usage: node scripts/browser-frame.mjs [--in recording/lajjha-showcase-1920x1080-60fps.mp4] [--url lajjha.com]
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'

const require = createRequire(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/cli/node_modules/x.js'))
const { chromium } = require('playwright-core')

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > -1 ? process.argv[i + 1] : d }
const ROOT = path.resolve(import.meta.dirname, '..')
const IN = path.resolve(ROOT, arg('in', 'recording/lajjha-showcase-1920x1080-60fps.mp4'))
const HOST = arg('url', 'lajjha.com')
const TITLE = 'Lajjha — Oxidised, not obedient'
const WORK = path.join(ROOT, 'recording', 'browser-frame')
fs.mkdirSync(WORK, { recursive: true })

// canvas 1920×1080; window 1600 wide; content 1600×900 (16:9); chrome = tab strip + toolbar
const CW = 1600, CH = 900, TAB = 44, BAR = 48, R = 12
const X = (1920 - CW) / 2, Y = Math.round((1080 - (CH + TAB + BAR)) / 2), CY = Y + TAB + BAR
const LOGO = pathToFileURL(path.join(ROOT, 'public/img/logo-ivory.svg')).href

const icon = d => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`
const HTML = `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{width:1920px;height:1080px;overflow:hidden;font:13px/1 "Segoe UI",system-ui,sans-serif;color:#e8eaed}
body{background:
  radial-gradient(1100px 700px at 12% 8%, rgba(169,120,44,.42), transparent 60%),
  radial-gradient(1000px 800px at 92% 96%, rgba(100,31,43,.85), transparent 62%),
  radial-gradient(700px 500px at 70% 10%, rgba(23,107,104,.30), transparent 60%),
  linear-gradient(160deg,#2a1a17,#140f10 60%,#1b1013)}
.win{position:absolute;left:${X}px;top:${Y}px;width:${CW}px;height:${CH + TAB + BAR}px;border-radius:${R}px;overflow:hidden;
  background:#202124;box-shadow:0 40px 90px rgba(0,0,0,.6),0 12px 30px rgba(0,0,0,.35),0 0 0 1px rgba(255,255,255,.09)}
.tabs{height:${TAB}px;display:flex;align-items:flex-end;padding-left:16px;background:#202124}
.lights{display:flex;gap:8px;align-self:center;margin-right:22px}
.lights i{width:12px;height:12px;border-radius:50%;display:block}
.tab{position:relative;width:260px;height:36px;border-radius:9px 9px 0 0;background:#35363a;display:flex;align-items:center;gap:9px;padding:0 10px 0 12px}
.tab::before,.tab::after{content:"";position:absolute;bottom:0;width:9px;height:9px;background:radial-gradient(circle at 0 0,transparent 9px,#35363a 9.5px)}
.tab::before{left:-9px;transform:scaleX(-1)}
.tab::after{right:-9px;background:radial-gradient(circle at 100% 0,transparent 9px,#35363a 9.5px);transform:scaleX(-1)}
.fav{width:18px;height:18px;border-radius:5px;background:#641F2B;display:grid;place-items:center;flex:none}
.fav img{width:14px;height:14px;object-fit:contain}
.ttl{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12.5px;color:#e8eaed}
.x{color:#9aa0a6;flex:none;display:grid}
.plus{color:#9aa0a6;margin:0 0 7px 12px;display:grid}
.bar{height:${BAR}px;background:#35363a;display:flex;align-items:center;gap:6px;padding:0 10px;border-bottom:1px solid #2a2b2e}
.btn{width:32px;height:32px;display:grid;place-items:center;color:#c4c7c5;border-radius:50%}
.btn.dim{color:#6f7377}
.omni{flex:1;height:34px;border-radius:17px;background:#202124;display:flex;align-items:center;gap:10px;padding:0 14px;margin:0 8px;font-size:14.5px}
.omni .host{color:#e8eaed;letter-spacing:.1px}
.omni .tune{color:#c4c7c5;display:grid}
.omni .star{margin-left:auto;color:#c4c7c5;display:grid}
.me{width:26px;height:26px;border-radius:50%;background:#A9782C;color:#171414;font-weight:700;display:grid;place-items:center;font-size:12px;margin:0 4px}
.page{height:${CH}px;background:#000}
</style>
<div class="win">
  <div class="tabs">
    <div class="lights"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
    <div class="tab"><span class="fav"><img src="${LOGO}"></span><span class="ttl">${TITLE}</span><span class="x">${icon('<path d="M7 7l10 10M17 7L7 17"/>').replace('width="20" height="20"', 'width="14" height="14"')}</span></div>
    <span class="plus">${icon('<path d="M12 5v14M5 12h14"/>').replace('width="20" height="20"', 'width="18" height="18"')}</span>
  </div>
  <div class="bar">
    <span class="btn">${icon('<path d="M19 12H5M11 6l-6 6 6 6"/>')}</span>
    <span class="btn dim">${icon('<path d="M5 12h14M13 6l6 6-6 6"/>')}</span>
    <span class="btn">${icon('<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>')}</span>
    <div class="omni">
      <span class="tune">${icon('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>').replace('width="20" height="20"', 'width="17" height="17"')}</span>
      <span class="host">${HOST}</span>
      <span class="star">${icon('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>').replace('width="20" height="20"', 'width="18" height="18"')}</span>
    </div>
    <span class="btn">${icon('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>')}</span>
    <span class="me">L</span>
    <span class="btn">${icon('<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>')}</span>
  </div>
  <div class="page"></div>
</div>`
const MASK = `<!doctype html><style>*{margin:0}html,body{width:${CW}px;height:${CH}px;background:#000}
div{width:${CW}px;height:${CH}px;background:#fff;border-radius:0 0 ${R}px ${R}px}</style><div></div>`

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const shot = async (html, w, h, out) => {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 })
  const file = path.join(WORK, path.basename(out, '.png') + '.html')
  fs.writeFileSync(file, html)
  await page.goto(pathToFileURL(file).href)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: out })
  await page.close()
}
const BG = path.join(WORK, 'bg.png'), MK = path.join(WORK, 'mask.png')
await shot(HTML, 1920, 1080, BG)
await shot(MASK, CW, CH, MK)
await browser.close()

if (process.argv.includes('--png-only')) process.exit(0)
const filter = `[0:v]scale=${CW}:${CH}:flags=lanczos,format=yuva444p[v];[2:v]format=gray[m];[v][m]alphamerge[vm];[1:v][vm]overlay=${X}:${CY}:shortest=1,format=yuv420p[out]`
const base = path.join(path.dirname(IN), path.basename(IN, '.mp4').replace('lajjha-showcase', 'lajjha-browser'))
// looped stills never end on their own, so cap the output at the recording's own length
const DUR = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', IN]).toString().trim()
const enc = (out, crf) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-stats', '-i', IN, '-loop', '1', '-framerate', '60', '-i', BG, '-loop', '1', '-framerate', '60', '-i', MK, '-t', DUR,
  '-filter_complex', filter, '-map', '[out]', '-r', '60', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-movflags', '+faststart', out], { stdio: 'inherit' })
enc(base + '.mp4', 17)
enc(base + '-share.mp4', 24)
console.log('wrote', base + '.mp4', 'and', base + '-share.mp4')
