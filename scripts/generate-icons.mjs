import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++)
      crc = crc & 1 ? (crc >>> 1) ^ 0xEDB88320 : crc >>> 1;
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.concat([t, data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc32(d));
  return Buffer.concat([len, t, data, c]);
}

function solidPNG(w, h, r, g, b) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
  ihdr[8]=8; ihdr[9]=2; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;

  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const row = y * (1 + w * 3);
    raw[row] = 0;
    for (let x = 0; x < w; x++) {
      const o = row + 1 + x * 3;
      raw[o] = r; raw[o+1] = g; raw[o+2] = b;
    }
  }

  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',deflateSync(raw)), chunk('IEND',Buffer.alloc(0))]);
}

const dir = 'public/icons';
mkdirSync(dir, { recursive: true });

const sizes = [
  { size: 192, r: 218, g: 165, b: 32, name: 'icon-192x192.png' },
  { size: 512, r: 218, g: 165, b: 32, name: 'icon-512x512.png' },
];

for (const { size, r, g, b, name } of sizes) {
  writeFileSync(`${dir}/${name}`, solidPNG(size, size, r, g, b));
  console.log(`✓ ${name} (${size}x${size})`);
}
