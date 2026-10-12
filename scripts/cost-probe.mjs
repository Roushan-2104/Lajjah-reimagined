import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire(path.join(process.env.APPDATA, 'npm/node_modules/@playwright/cli/node_modules/x.js'))
const { chromium } = require('playwright-core')
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--ignore-gpu-blocklist', '--hide-scrollbars'] })
const variants = { noao: '', 'noao-nosmaa': '' }
for (const [name, css] of Object.entries(variants)) {
  const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
  await page.clock.install({ time: new Date('2026-10-12T10:00:00') })
  await page.goto('http://127.0.0.1:5190/?' + name, { waitUntil: 'load' }); await page.waitForLoadState('networkidle')
  if (css) await page.addStyleTag({ content: css })
  await page.clock.runFor(16); await page.waitForTimeout(1500)
  const cdp = await page.context().newCDPSession(page)
  const ts = []
  for (let i = 0; i < 3; i++) { await page.clock.runFor(16.67); const a = Date.now(); await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92 }); ts.push(Date.now() - a) }
  console.log(name.padEnd(11), ts.join(','))
  await page.context().close()
}
await browser.close()
