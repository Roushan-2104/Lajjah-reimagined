import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/cli/node_modules/x.js'))
const { chromium } = require('playwright-core')
const mode = process.argv[2]
const args = ['--ignore-gpu-blocklist', '--hide-scrollbars', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-background-timer-throttling']
if (mode === 'headed') args.push('--window-position=-2600,0', '--window-size=1920,1080')
if (mode === 'headless-gpu') args.push('--use-angle=d3d11', '--enable-gpu', '--use-gl=angle')
const browser = await chromium.launch({ channel: 'chrome', headless: mode !== 'headed', args })
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
await page.clock.install({ time: new Date('2026-10-12T10:00:00') })
await page.goto('http://127.0.0.1:5190/', { waitUntil: 'load' }); await page.waitForLoadState('networkidle')
await page.clock.runFor(16); await page.waitForTimeout(2000)
const r = await page.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return gl.getParameter(e.UNMASKED_RENDERER_WEBGL) })
const t0 = Date.now()
const cdp = await page.context().newCDPSession(page)
for (let i = 0; i < 4; i++) {
  let a = Date.now(); await page.clock.runFor(16.67); const tRun = Date.now() - a
  a = Date.now(); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 }); const tShot = Date.now() - a
  a = Date.now(); await page.evaluate(() => 1); const tEval = Date.now() - a
  console.log('runFor', tRun, 'shot', tShot, 'eval', tEval)
}
console.log(mode, '|', r, '|', ((Date.now() - t0) / 8).toFixed(0), 'ms/frame')
await browser.close()
