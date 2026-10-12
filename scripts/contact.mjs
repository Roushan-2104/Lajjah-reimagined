import sharp from 'sharp'; import fs from 'fs'; import path from 'path';
const dir = process.argv[2], out = process.argv[3];
const files = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const T = 220, cols = 7, rows = Math.ceil(files.length / cols);
const tiles = await Promise.all(files.map(async (f, i) => {
  let buf; try { buf = await sharp(path.join(dir, f)).resize(T, T, { fit: "cover" }).toBuffer(); } catch (e) { console.error("BAD", f, e.message); buf = await sharp({ create: { width: T, height: T, channels: 3, background: "#900" } }).png().toBuffer(); }
  const label = Buffer.from(`<svg width="${T}" height="18"><rect width="100%" height="100%" fill="#000"/><text x="4" y="13" font-size="11" fill="#fff" font-family="monospace">${i}: ${f.slice(0, 28)}</text></svg>`);
  return [{ input: buf, left: (i % cols) * T, top: Math.floor(i / cols) * (T + 18) }, { input: label, left: (i % cols) * T, top: Math.floor(i / cols) * (T + 18) + T }];
}));
await sharp({ create: { width: cols * T, height: rows * (T + 18), channels: 3, background: '#222' } }).composite(tiles.flat()).jpeg({ quality: 70 }).toFile(out);
console.log(files.map((f, i) => i + ':' + f).join('\n'));
