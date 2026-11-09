// Maakt de app-iconen (PNG) zonder externe tools: groen gras, blauwe plas, gele ster.
// Gebruik: node scripts/maak-iconen.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTabel = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTabel[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function inSter(x, y, cx, cy, rBuiten, rBinnen) {
  // punt-in-polygoon voor een 5-puntige ster
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? rBinnen : rBuiten;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  let binnen = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) binnen = !binnen;
  }
  return binnen;
}

function kleur(u, v) {
  // u, v in [0,1]
  const gras = [95, 174, 90];
  const zand = [243, 217, 139];
  const plas = [30, 90, 138];
  const plasLicht = [59, 138, 196];
  const ster = [255, 214, 64];
  const sterRand = [184, 120, 20];
  if (inSter(u, v, 0.5, 0.52, 0.27, 0.11)) return ster;
  if (inSter(u, v, 0.5, 0.52, 0.31, 0.135)) return sterRand;
  const dx = (u - 0.5) / 0.42, dy = (v - 0.52) / 0.36;
  const d = dx * dx + dy * dy;
  if (d < 1) {
    const t = Math.sqrt(d);
    return plas.map((c, i) => Math.round(plasLicht[i] * (1 - t) + c * t));
  }
  if (d < 1.25) return zand;
  return gras;
}

function maakPng(grootte) {
  const ss = 3; // supersampling voor gladde randen
  const rijen = [];
  for (let y = 0; y < grootte; y++) {
    const rij = Buffer.alloc(1 + grootte * 3);
    for (let x = 0; x < grootte; x++) {
      const som = [0, 0, 0];
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++) {
          const k = kleur((x + (sx + 0.5) / ss) / grootte, (y + (sy + 0.5) / ss) / grootte);
          som[0] += k[0]; som[1] += k[1]; som[2] += k[2];
        }
      for (let i = 0; i < 3; i++) rij[1 + x * 3 + i] = Math.round(som[i] / (ss * ss));
    }
    rijen.push(rij);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(grootte, 0);
  ihdr.writeUInt32BE(grootte, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8 bit RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(rijen))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [naam, g] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  writeFileSync(new URL(`../public/icons/${naam}`, import.meta.url), maakPng(g));
  console.log('gemaakt:', naam);
}
