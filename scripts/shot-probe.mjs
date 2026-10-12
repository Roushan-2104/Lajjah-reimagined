import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/cli/node_modules/x.js'))
const { chromium } = require('playwright-core')
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--ignore-gpu-blocklist', '--hide-scrollbars'] })
for (const fake of [false, true]) {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
  if (fake) await page.clock.install({ time: new Date('2026-10-12T10:00:00') })
  await page.setContent('<h1 style="font:80px sans-serif">hello</h1><canvas id=c width=800 height=600></canvas><script>const gl=c.getContext("webgl2");function f(){gl.clearColor(Math.random(),0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);requestAnimationFrame(f)}f()</script>')
  const cdp = await page.context().newCDPSession(page)
  const ts = []
  for (let i = 0; i < 4; i++) { if (fake) await page.clock.runFor(16.67); const a = Date.now(); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 }); ts.push(Date.now() - a) }
  console.log('fake clock', fake, 'shot ms', ts.join(','))
}
await browser.close()
