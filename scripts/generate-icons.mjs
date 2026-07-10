/**
 * Gera ícones PWA placeholder (fundo azul, "M" branco simplificado) sem
 * dependências de imagem — PNG cru + zlib. Substituir por ícones de verdade
 * na Fase 6 (polish).
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buf) {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** "M" estilizado: colunas nas laterais e diagonais centrais. */
function isLetterM(x, y, size) {
  const margin = size * 0.22;
  const stroke = size * 0.11;
  const top = margin;
  const bottom = size - margin;
  if (y < top || y > bottom) return false;
  const left = margin;
  const right = size - margin;
  if (x >= left && x <= left + stroke) return true;
  if (x >= right - stroke && x <= right) return true;
  const mid = size / 2;
  const progress = (y - top) / (bottom - top);
  if (progress <= 0.62) {
    const leftDiag = left + stroke / 2 + progress * (mid - left - stroke / 2);
    const rightDiag = right - stroke / 2 - progress * (right - mid - stroke / 2);
    if (Math.abs(x - leftDiag) <= stroke * 0.7) return true;
    if (Math.abs(x - rightDiag) <= stroke * 0.7) return true;
  }
  return false;
}

function makePng(size) {
  const bg = [14, 165, 233]; // brand-500
  const fg = [255, 255, 255];
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filtro none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = isLetterM(x, y, size) ? fg : bg;
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [file, size] of [
  ['public/pwa-192x192.png', 192],
  ['public/pwa-512x512.png', 512],
  ['public/apple-touch-icon.png', 180],
]) {
  writeFileSync(file, makePng(size));
  console.log(`${file} (${size}x${size})`);
}
