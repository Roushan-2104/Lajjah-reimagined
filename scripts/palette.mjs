// Pulls dominant colours from the brand's own photos (k-means on downsampled pixels).
import sharp from 'sharp'; import fs from 'fs'; import path from 'path';
const files = process.argv.slice(2);
const px = [];
for (const f of files) {
  const { data } = await sharp(f).resize(60, 60, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);
}
const K = 12; let cent = Array.from({ length: K }, (_, i) => px[Math.floor(i * px.length / K)]);
for (let it = 0; it < 20; it++) {
  const sum = cent.map(() => [0, 0, 0, 0]);
  for (const p of px) { let b = 0, bd = 1e9; cent.forEach((c, j) => { const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2; if (d < bd) { bd = d; b = j; } }); const s = sum[b]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++; }
  cent = sum.map((s, j) => s[3] ? [s[0]/s[3], s[1]/s[3], s[2]/s[3], s[3]] : cent[j]);
}
const hex = c => '#' + c.slice(0, 3).map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
cent.sort((a, b) => (b[3]||0) - (a[3]||0)).forEach(c => console.log(hex(c), ((c[3]||0) / px.length * 100).toFixed(1) + '%'));
