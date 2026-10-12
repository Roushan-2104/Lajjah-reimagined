import sharp from 'sharp'; import path from 'path';
const [out, cols, w, ...files] = process.argv.slice(2);
const C = +cols, W = +w;
const metas = await Promise.all(files.map(f => sharp(f).metadata()));
const H = Math.round(W * metas[0].height / metas[0].width);
const tiles = await Promise.all(files.map(async (f, i) => ({ input: await sharp(f).resize(W, H, { fit: 'cover', position: 'top' }).toBuffer(), left: (i % C) * (W + 6), top: Math.floor(i / C) * (H + 6) })));
await sharp({ create: { width: C * (W + 6), height: Math.ceil(files.length / C) * (H + 6), channels: 3, background: '#777' } }).composite(tiles).jpeg({ quality: 80 }).toFile(out);
