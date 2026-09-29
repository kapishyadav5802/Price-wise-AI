/* Rasterises the WarGrid logo mark into every icon/splash size the PWA manifest
   and the Capacitor Android project need. Pure SVG -> PNG via sharp, no assets. */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const out = process.argv[2] || 'public/icons'
fs.mkdirSync(out, { recursive: true })

/* the mark lives in a 32x32 box (src/icons.jsx LogoMark); its ink spans
   x 3..30.9, y 5.5..26.5, so the optical centre is ~ (17, 16) */
const mark = (k, cx, cy) => `
  <g transform="translate(${cx - 17 * k} ${cy - 16 * k}) scale(${k})">
    <path d="M3 5.5h6.6l3.6 14.2 3.6-14.2H23l-6 21h-8z" fill="url(#blue)"/>
    <path d="M21.6 5.5h6.9l2.4 10.2-2.4 10.2h-6.9l2.6-10.2z" fill="url(#yellow)"/>
    <path d="M6.4 9.2h11.2" stroke="rgba(255,255,255,.5)" stroke-width="1.2"/>
  </g>`

const grads = `<linearGradient id="blue" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4d95ff"/><stop offset="1" stop-color="#00d5ff"/>
    </linearGradient>
    <linearGradient id="yellow" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffd400"/><stop offset="1" stop-color="#e8ff3a"/>
    </linearGradient>`

/* app icon — 512 design box; `scale` is the mark size, `rounded` bakes iOS-style corners */
function iconSvg(size, { rounded = false, scale = 11, ring = false, glow = true, grid = true } = {}) {
  const r = rounded ? 114 : 0
  let gridLines = ''
  if (grid) for (let i = 1; i < 8; i++) gridLines += `<path d="M${i * 64} 0V512M0 ${i * 64}H512" stroke="#2d7dff" stroke-opacity=".13" stroke-width="2"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1428"/><stop offset=".55" stop-color="#070a14"/><stop offset="1" stop-color="#04050a"/>
    </linearGradient>
    ${grads}
    <radialGradient id="glow" cx=".5" cy=".12" r=".85">
      <stop offset="0" stop-color="#2d7dff" stop-opacity=".5"/><stop offset=".55" stop-color="#2d7dff" stop-opacity=".12"/>
      <stop offset="1" stop-color="#2d7dff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowY" cx=".5" cy="1" r=".7">
      <stop offset="0" stop-color="#e8ff3a" stop-opacity=".16"/><stop offset="1" stop-color="#e8ff3a" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="clip"><rect width="512" height="512" rx="${r}" ry="${r}"/></clipPath>
  </defs>
  <g clip-path="url(#clip)">
    <rect width="512" height="512" fill="url(#bg)"/>
    ${gridLines}
    ${glow ? '<rect width="512" height="512" fill="url(#glow)"/><rect width="512" height="512" fill="url(#glowY)"/>' : ''}
    ${ring ? '<rect x="12" y="12" width="488" height="488" rx="' + Math.max(0, r - 10) + '" fill="none" stroke="rgba(0,213,255,.24)" stroke-width="3"/>' : ''}
    ${mark(scale, 256, 256)}
  </g>
</svg>`
}

/* adaptive-icon foreground: transparent, mark inside the 66 % safe zone (108 box) */
function foregroundSvg(size) {
  const k = 4.4
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 108 108">
  <defs>${grads}</defs>
  ${mark(k, 54, 54)}
</svg>`
}

/* splash: mark centred small on the arena background with wide safe margins */
function splashSvg(size) {
  let gridLines = ''
  for (let i = 1; i < 16; i++) gridLines += `<path d="M${i * 64} 0V1024M0 ${i * 64}H1024" stroke="#2d7dff" stroke-opacity=".09" stroke-width="2"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0d1428"/><stop offset=".55" stop-color="#070a14"/><stop offset="1" stop-color="#04050a"/>
    </linearGradient>
    ${grads}
    <radialGradient id="glow" cx=".5" cy=".44" r=".5"><stop offset="0" stop-color="#2d7dff" stop-opacity=".45"/><stop offset="1" stop-color="#2d7dff" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowY" cx=".5" cy=".98" r=".5"><stop offset="0" stop-color="#e8ff3a" stop-opacity=".13"/><stop offset="1" stop-color="#e8ff3a" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${gridLines}
  <rect width="1024" height="1024" fill="url(#glow)"/>
  <rect width="1024" height="1024" fill="url(#glowY)"/>
  ${mark(6.6, 512, 478)}
  <rect x="452" y="612" width="120" height="4" rx="2" fill="#00d5ff" fill-opacity=".55"/>
</svg>`
}

async function write(file, buf) {
  const p = path.join(out, file)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  await sharp(Buffer.from(buf)).png().toFile(p)
  console.log('  ✓', file.padEnd(38), `${Math.round(fs.statSync(p).size / 1024)}KB`)
}

async function main() {
  console.log('WarGrid icon set →', out)
  /* PWA + store listing */
  await write('icon-192.png', iconSvg(192, { rounded: true }))
  await write('icon-512.png', iconSvg(512, { rounded: true }))
  await write('icon-1024.png', iconSvg(1024, { rounded: true, ring: true }))
  await write('maskable-192.png', iconSvg(192, { scale: 8.6 }))
  await write('maskable-512.png', iconSvg(512, { scale: 8.6 }))
  /* iOS home screen masks the icon itself -> full bleed */
  await write('apple-touch-icon.png', iconSvg(180, { scale: 9.6 }))
  await write('favicon-32.png', iconSvg(32, { rounded: true, scale: 12, grid: false }))
  /* Android launcher resources */
  for (const [d, s] of Object.entries({ mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 })) {
    await write(`mipmap-${d}/ic_launcher.png`, iconSvg(s, { rounded: true }))
    await write(`mipmap-${d}/ic_launcher_round.png`, iconSvg(s, { rounded: true }))
    await write(`mipmap-${d}/ic_launcher_foreground.png`, foregroundSvg(Math.round((s / 48) * 108)))
  }
  /* splashes */
  await write('splash.png', splashSvg(1280))
  await write('splash-2732.png', splashSvg(2732))
  /* iOS launch screens, device-exact */
  for (const [w, h] of [
    [750, 1334],
    [828, 1792],
    [1125, 2436],
    [1242, 2688],
    [1170, 2532],
    [1284, 2778],
    [1179, 2556],
    [1290, 2796],
  ]) {
    const f = `startup-${w}x${h}.png`
    await sharp(Buffer.from(splashSvg(2732)))
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .png()
      .toFile(path.join(out, f))
    console.log('  ✓', f)
  }
  console.log('done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
