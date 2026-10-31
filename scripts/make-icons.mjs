// 앱 아이콘(PNG)을 만든다: 남색 바탕에 흰 실뭉치 모양. 실행: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'

const NAVY = [0x2e, 0x4a, 0x7d]
const WHITE = [0xff, 0xff, 0xff]

const crcTable = new Uint32Array(256).map((_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

// 0~1 사이 값으로 가장자리를 부드럽게 한다.
const edge = (d) => Math.max(0, Math.min(1, 0.5 - d))

function render(size) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  const c = size / 2
  const ringR = size * 0.27
  const ringW = size * 0.055
  const dotR = size * 0.04
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - c
      const dy = y + 0.5 - c
      const dist = Math.hypot(dx, dy)
      const ring = edge(Math.abs(dist - ringR) - ringW / 2)
      // 실뭉치 안쪽을 가로지르는 사선 두 줄
      const d1 = Math.abs(dx - dy) / Math.SQRT2
      const d2 = Math.abs(dx + dy) / Math.SQRT2
      const inside = dist < ringR ? 1 : 0
      const line = inside * Math.max(edge(d1 - ringW / 3), edge(d2 - ringW / 3)) * (dist > dotR ? 1 : 0)
      const a = Math.min(1, ring + line * 0.9)
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = Math.round(NAVY[0] + (WHITE[0] - NAVY[0]) * a)
      raw[o + 1] = Math.round(NAVY[1] + (WHITE[1] - NAVY[1]) * a)
      raw[o + 2] = Math.round(NAVY[2] + (WHITE[2] - NAVY[2]) * a)
      raw[o + 3] = 255
    }
  }
  const head = Buffer.alloc(13)
  head.writeUInt32BE(size, 0)
  head.writeUInt32BE(size, 4)
  head[8] = 8
  head[9] = 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', head),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

mkdirSync('public', { recursive: true })
writeFileSync('public/pwa-512.png', render(512))
writeFileSync('public/pwa-192.png', render(192))
writeFileSync('public/apple-touch-icon.png', render(180))
console.log('아이콘 3개를 public/ 에 만들었어요.')
