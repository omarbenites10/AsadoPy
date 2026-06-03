/**
 * Generates solid-color PNG icons for the PWA without external dependencies.
 * Uses Node.js built-in zlib (deflateSync) and CRC32.
 */
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'

function makeCRCTable() {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c
  }
  return table
}

const CRC_TABLE = makeCRCTable()

function crc32(buf) {
  let crc = 0xffffffff
  for (const byte of buf) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.allocUnsafe(4)
  len.writeUInt32BE(data.length, 0)
  const crcInput = Buffer.concat([typeBuf, data])
  const crcBuf = Buffer.allocUnsafe(4)
  crcBuf.writeUInt32BE(crc32(crcInput), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function createSolidPNG(width, height, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.allocUnsafe(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 2  // RGB color type
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace

  const rowLen = 1 + width * 3
  const rawData = Buffer.allocUnsafe(rowLen * height)
  for (let y = 0; y < height; y++) {
    const base = y * rowLen
    rawData[base] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      rawData[base + 1 + x * 3] = r
      rawData[base + 2 + x * 3] = g
      rawData[base + 3 + x * 3] = b
    }
  }

  const compressed = deflateSync(rawData, { level: 6 })

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// #f97316 = rgb(249, 115, 22) — orange-500
const [R, G, B] = [249, 115, 22]

const icons = [
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
  { name: 'icon-maskable', size: 512 },
  { name: 'apple-touch-icon', size: 180 },
]

mkdirSync('public/icons', { recursive: true })

for (const { name, size } of icons) {
  const png = createSolidPNG(size, size, R, G, B)
  writeFileSync(`public/icons/${name}.png`, png)
  console.log(`✓ public/icons/${name}.png (${size}×${size})`)
}
