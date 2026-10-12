// Engraving textures for the procedural 3D jewellery, cut from the brand's own product photos
// ("projection-first fidelity" from img2threejs: put the photo's real pixels on the mesh).
// Each crop becomes a neutral grayscale albedo (metal tint comes from the material) + a normal map.
// Run: node scripts/prepare-textures.mjs
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets-src', 'products')
const OUT = path.join(ROOT, 'public', 'img', 'tex')
fs.mkdirSync(OUT, { recursive: true })

const CROPS = {
  // Ira crescent: floral repoussé on the left flank of the tube (runs vertically in the photo)
  'ira-engrave': { file: 'LJ-NC-GS-002_IMG_5094.jpg', box: { left: 345, top: 600, width: 150, height: 460 }, rotate: 90, size: [1024, 334] },
  // Kaveri hasli: centre plaque with paisley scrolls, and the rosette row above it
  'kaveri-panel': { file: 'LJ-NC-GS-003_IMG_5095.jpg', box: { left: 612, top: 1268, width: 336, height: 108 }, size: [768, 247] },
  'kaveri-rosette': { file: 'LJ-NC-GS-003_IMG_5095.jpg', box: { left: 640, top: 1219, width: 300, height: 40 }, size: [600, 80] },
  // Aditi 92.5 jhumka: filigree stud disc and filigree dome
  'aditi-stud': { file: 'LJ-ER-SS-002_aditi_sterling_jhumka.jpg', box: { left: 185, top: 265, width: 210, height: 215 }, size: [512, 512] },
  'aditi-dome': { file: 'LJ-ER-SS-002_aditi_sterling_jhumka.jpg', box: { left: 205, top: 590, width: 300, height: 140 }, size: [768, 358] },
}

async function normalFrom(gray, w, h, strength) {
  const at = (x, y) => gray[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))] / 255
  const o = Buffer.alloc(w * h * 3)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x - 1, y) + at(x - 1, y + 1))
    const dy = (at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1)) - (at(x - 1, y - 1) + 2 * at(x, y - 1) + at(x + 1, y - 1))
    let nx = -dx * strength, ny = dy * strength, nz = 1
    const l = Math.hypot(nx, ny, nz)
    const i = (y * w + x) * 3
    o[i] = (nx / l * 0.5 + 0.5) * 255; o[i + 1] = (ny / l * 0.5 + 0.5) * 255; o[i + 2] = (nz / l * 0.5 + 0.5) * 255
  }
  return o
}

for (const [id, c] of Object.entries(CROPS)) {
  let img = sharp(path.join(SRC, c.file)).extract(c.box)
  if (c.rotate) img = sharp(await img.rotate(c.rotate).toBuffer())
  const [w, h] = c.size
  // neutral grayscale, contrast-stretched so recesses go deep black and high points stay bright
  const gray = await img.resize(w, h, { fit: 'fill' }).greyscale().normalise({ lower: 2, upper: 98 }).raw().toBuffer()
  await sharp(gray, { raw: { width: w, height: h, channels: 1 } }).webp({ quality: 86 }).toFile(path.join(OUT, `${id}.webp`))
  // soften before differentiating so linen weave / JPEG noise doesn't become fake relief
  const soft = await sharp(gray, { raw: { width: w, height: h, channels: 1 } }).blur(1.1).raw().toBuffer()
  const n = await normalFrom(soft, w, h, 3.2)
  await sharp(n, { raw: { width: w, height: h, channels: 3 } }).webp({ quality: 88 }).toFile(path.join(OUT, `${id}-n.webp`))
  console.log('tex', id, `${w}x${h}`)
}
