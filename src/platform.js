/* ══════════════════════════════════════════════════════════════════════════
   platform layer — makes WarGrid behave like a real installed app
   • detects installed contexts (PWA standalone / fullscreen / Capacitor)
   • captures the Chromium install prompt so the UI can offer "Install"
   • registers the offline service worker (web builds only)
   • hands control to src/native.js when running inside the native shell
   ══════════════════════════════════════════════════════════════════════════ */

export const isNative = () =>
  typeof window !== 'undefined' &&
  !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform())

export const isStandalone = () => {
  if (typeof window === 'undefined') return false
  if (isNative()) return true
  if (window.navigator.standalone === true) return true // iOS Safari "Add to Home Screen"
  return ['standalone', 'fullscreen', 'minimal-ui'].some((m) => window.matchMedia?.(`(display-mode: ${m})`)?.matches)
}

/* ── deferred install prompt ───────────────────────────────────────────── */
let deferred = null
const listeners = new Set()

export function onInstallAvailability(cb) {
  listeners.add(cb)
  cb(!!deferred)
  return () => listeners.delete(cb)
}

export const installReady = () => !!deferred

export async function promptInstall() {
  if (!deferred) return 'unavailable'
  deferred.prompt()
  const choice = await deferred.userChoice
  deferred = null
  listeners.forEach((cb) => cb(false))
  return choice?.outcome || 'dismissed'
}

/* ── haptics: real vibration inside the native shell, silent no-op on web ─ */
export function haptic(kind = 'light') {
  window.__wgHaptic?.(kind)
}

/* ── boot ──────────────────────────────────────────────────────────────── */
export async function initPlatform() {
  if (typeof window === 'undefined') return

  if (isStandalone()) document.body.classList.add('app-mode')

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e
    listeners.forEach((cb) => cb(true))
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    listeners.forEach((cb) => cb(false))
  })

  /* delegated tap haptics — native only, zero cost on the web */
  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest?.('.btn-cta, .btn-primary, .fab, .pay-opt, .nav-item')) haptic('light')
    },
    { passive: true }
  )

  if (isNative()) {
    try {
      const m = await import('./native')
      await m.initNative()
    } catch (err) {
      console.warn('[wargrid] native bridge unavailable', err)
    }
    return
  }

  /* offline shell — production web builds only (dev server keeps HMR clean) */
  if (import.meta.env.PROD && 'serviceWorker' in window.navigator) {
    window.addEventListener('load', () => {
      window.navigator.serviceWorker.register('./sw.js').catch(() => {})
    })
  }
}
