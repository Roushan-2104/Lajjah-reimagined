// Builds web-ready images, depth maps (Depth Anything V2) and the liquid-logo mask.
// Run: node scripts/prepare-assets.mjs
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline, RawImage } from '@huggingface/transformers';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'assets-src');
const OUT = path.join(ROOT, 'public', 'img');
fs.mkdirSync(path.join(OUT, 'depth'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'normal'), { recursive: true });

// tangent-space normal map from a depth map, so a moving light can rake across engraving
async function normalFromDepth(src, out, strength = 6) {
  const { data, info } = await sharp(src).greyscale().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const at = (x, y) => data[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))] / 255
  const o = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1))
    const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1))
    let nx = -dx * strength, ny = dy * strength, nz = 1
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l
    const i = (y * w + x) * 3
    o[i] = (nx * 0.5 + 0.5) * 255; o[i + 1] = (ny * 0.5 + 0.5) * 255; o[i + 2] = (nz * 0.5 + 0.5) * 255
  }
  await sharp(o, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 88 }).toFile(out)
}

// id -> source file. Ids are what the app references.
export const SOURCES = {
  // hero tray: the Bangla-script hasli flatlay, cropped to the velvet area
  'tray': { file: 'insta/ig-04.jpg', crop: { left: 20, top: 40, width: 460, height: 470 } },
  'ig-vira': 'insta/ig-01.jpg',
  'ig-rani': 'insta/ig-02.jpg',
  'ig-anika': 'insta/ig-03.jpg',
  'ig-bangla': 'insta/ig-04.jpg',
  'ig-noir': 'insta/ig-05.jpg',
  'ig-peacock': 'insta/ig-06.jpg',
  'meera': 'products/LJ-NC-GS-001_IMG_5092.jpg',
  'ira': 'products/LJ-NC-GS-002_IMG_5094.jpg',
  'kaveri': 'products/LJ-NC-GS-003_IMG_5095.jpg',
  'anika': 'products/LJ-NC-GS-004_IMG_5097.jpg',
  'rani': 'products/LJ-NC-GS-005_IMG_5098.jpg',
  'vira': 'products/LJ-NC-GS-007_IMG_5100.jpg',
  'aara': 'products/LJ-NC-GS-008_IMG_5101.jpg',
  'nira': 'products/LJ-NC-GS-009_IMG_5103.jpg',
  'meera-collar': 'products/LJ-NC-GS-011_IMG_5104.jpg',
  'roop': 'products/LJ-NC-SS-001_roop_sterling_choker.jpg',
  'aditi': 'products/LJ-ER-SS-002_aditi_sterling_jhumka.jpg',
};

const depth = await pipeline('depth-estimation', 'onnx-community/depth-anything-v2-small', { dtype: 'fp32' });

const only = process.argv[2] ? process.argv[2].split(',') : null
for (const [id, entry] of Object.entries(SOURCES)) {
  if (only && !only.includes(id)) continue
  const rel = typeof entry === 'string' ? entry : entry.file
  let file = path.join(SRC, rel);
  if (!fs.existsSync(file)) { console.warn('missing', rel); continue; }
  if (entry.crop) { const tmp = path.join(SRC, '.crop-' + id + '.png'); await sharp(file).extract(entry.crop).png().toFile(tmp); file = tmp }
  const img = sharp(file).rotate();
  const meta = await img.metadata();
  // colour image: 1000px long edge, square-cropped variant for cards
  await sharp(file).rotate().resize(1000, 1000, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(OUT, `${id}.webp`));
  await sharp(file).rotate().resize(720, 900, { fit: 'cover', position: 'attention' }).webp({ quality: 72 }).toFile(path.join(OUT, `${id}-card.webp`));

  // depth for both crops, computed on the exact pixels the app will show
  for (const suffix of ['', '-card']) {
    const shown = path.join(OUT, `${id}${suffix}.webp`);
    const png = await sharp(shown).png().toBuffer();
    const raw = await RawImage.fromBlob(new Blob([png], { type: 'image/png' }));
    const { depth: d } = await depth(raw);
    const { width, height } = await sharp(shown).metadata();
    // smooth the map a little so displacement doesn't tear on fine filigree
    await sharp(Buffer.from(d.data), { raw: { width: d.width, height: d.height, channels: 1 } })
      .resize(Math.round(width / 2), Math.round(height / 2))
      .blur(0.8)
      .webp({ quality: 80 })
      .toFile(path.join(OUT, 'depth', `${id}${suffix}.webp`));
  }
  for (const suffix of ['', '-card']) await normalFromDepth(path.join(OUT, 'depth', id + suffix + '.webp'), path.join(OUT, 'normal', id + suffix + '.webp'))
  console.log('ok', id, `${meta.width}x${meta.height}`);
}

if (only) process.exit(0)
// Liquid-logo mask: the wordmark path only (drop the ivory backing disc), black on transparent.
const svg = fs.readFileSync(path.join(SRC, 'logo.svg'), 'utf8');
const d = svg.match(/<path[^>]*d="([^"]+)"/)[1];
const fillRule = /fill-rule="evenodd"/.test(svg) ? ' fill-rule="evenodd"' : '';
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="212 516 1980 1300" width="1980" height="1300"><path fill="#000"${fillRule} d="${d}"/></svg>`;
fs.writeFileSync(path.join(OUT, 'logo-mark.svg'), mark);
await sharp(Buffer.from(mark)).resize(1000).png().toFile(path.join(OUT, 'logo-mask.png'));
// ivory version of the full mark for the nav / footer
const ivory = svg.replace(/fill="#F5EBDD"/, 'fill="none"').replace(/fill="#171414"/, 'fill="#ECEAE4"');
fs.writeFileSync(path.join(OUT, 'logo-ivory.svg'), ivory);
fs.writeFileSync(path.join(OUT, 'logo-ink.svg'), svg.replace(/fill="#F5EBDD"/, 'fill="none"').replace(/fill="#171414"/, 'fill="#121110"'));
console.log('logo done');
