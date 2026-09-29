/* Copies the generated WarGrid icon + splash art from public/icons into the
   Capacitor Android project, resizing each splash to the exact pixel size the
   Gradle template expects. Run after tools/gen-icons.cjs when rebranding.
   Usage: node tools/sync-android-art.cjs   (requires `npm i -D sharp`) */
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const gen = path.join(ROOT, 'public/icons')
const res = path.join(ROOT, 'android/app/src/main/res')

async function copy(file) {
  const from = path.join(gen, file)
  const to = path.join(res, file)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

async function splashTo(file) {
  const to = path.join(res, file)
  const { width, height } = await sharp(to).metadata()
  await sharp(path.join(gen, 'splash-2732.png'))
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(to + '.tmp')
  fs.renameSync(to + '.tmp', to)
  console.log('  ✓', file, `${width}x${height}`)
}

async function main() {
  if (!fs.existsSync(res)) {
    console.error('android/ project missing — run `npx cap add android` first')
    process.exit(1)
  }
  for (const d of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
    for (const f of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      await copy(`mipmap-${d}/${f}`)
    }
    console.log('  ✓ mipmap-' + d)
  }
  for (const dir of fs.readdirSync(res).filter((d) => d.startsWith('drawable'))) {
    const p = path.join(res, dir, 'splash.png')
    if (fs.existsSync(p)) await splashTo(`${dir}/splash.png`)
  }
  console.log('android resources branded')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
