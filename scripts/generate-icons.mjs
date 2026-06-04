/**
 * Generates PWA PNG icons from the SVG source using @resvg/resvg-js.
 * Falls back to solid-color PNGs if WASM fails (CI environments, etc.).
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs'
import { deflateSync } from 'zlib'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// ── Flame SVG template ────────────────────────────────────────────────────────

function buildSvg(size) {
  const radius = Math.round(size * 0.22)
  const scale = size / 100
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#f97316"/>
  <g transform="translate(${16 * scale}, ${8 * scale}) scale(${2.83 * scale})">
    <path
      fill="none"
      stroke="white"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
    />
  </g>
</svg>`
}

// ── Fallback: solid-color PNG (pure Node.js, no deps) ────────────────────────

function makeCRCTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
}
const CRC_TABLE = makeCRCTable()

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function solidColorPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.allocUnsafe(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
  const rowLen = 1 + size * 3
  const raw = Buffer.allocUnsafe(rowLen * size)
  for (let y = 0; y < size; y++) {
    const base = y * rowLen; raw[base] = 0
    for (let x = 0; x < size; x++) {
      raw[base + 1 + x * 3] = r; raw[base + 2 + x * 3] = g; raw[base + 3 + x * 3] = b
    }
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 6 })), chunk('IEND', Buffer.alloc(0))])
}

// ── Main ──────────────────────────────────────────────────────────────────────

mkdirSync(`${ROOT}/public/icons`, { recursive: true })

const icons = [
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
  { name: 'icon-maskable', size: 512 },
  { name: 'apple-touch-icon', size: 180 },
]

let useResvg = false
let Resvg

try {
  const mod = await import('@resvg/resvg-js')
  Resvg = mod.Resvg
  useResvg = true
  console.log('Using @resvg/resvg-js for high-quality SVG→PNG rendering')
} catch {
  console.log('@resvg/resvg-js unavailable — using solid-color fallback')
}

for (const { name, size } of icons) {
  const outPath = `${ROOT}/public/icons/${name}.png`
  if (useResvg) {
    const svg = buildSvg(size)
    const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
    const data = resvg.render()
    writeFileSync(outPath, data.asPng())
  } else {
    writeFileSync(outPath, solidColorPNG(size, 249, 115, 22))
  }
  console.log(`✓ public/icons/${name}.png (${size}×${size})`)
}

// Copy base SVG for reference
writeFileSync(`${ROOT}/public/icons/icon.svg`, buildSvg(100))
console.log('✓ public/icons/icon.svg')
