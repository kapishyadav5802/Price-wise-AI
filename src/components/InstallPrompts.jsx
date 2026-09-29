/* ══════════════════════════════════════════════════════════════════════════
   install affordances
   • FrameBanner — the Arena/preview pane embeds the app in an <iframe>, where
     browsers refuse to fire beforeinstallprompt. Detect it and offer a
     one-tap escape into a real top-level tab.
   • InstallNudge — a single, dismissible bottom card the first time a visitor
     lands: uses the captured Chromium prompt when available, otherwise shows
     the per-platform path (iOS share sheet / desktop install icon).
   Both are SSR-safe (no window access during render).
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useState } from 'react'
import { Icon } from '../icons'
import { Btn } from '../ui'
import { useWG } from '../store'
import { isStandalone, onInstallAvailability, promptInstall } from '../platform'

const inFrame = () => {
  try {
    return typeof window !== 'undefined' && window.self !== window.top
  } catch {
    return true
  }
}

export function FrameBanner() {
  const [framed, setFramed] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    setFramed(inFrame())
  }, [])

  if (!framed || hidden) return null
  return (
    <div className="frame-banner" role="status">
      <Icon name="download" size={15} />
      <span className="grow">Preview frame — open WarGrid in its own tab to install it.</span>
      <button
        className="frame-open"
        onClick={() => window.open(window.location.href, '_blank', 'noopener')}
      >
        Open tab
      </button>
      <button className="frame-x" onClick={() => setHidden(true)} aria-label="dismiss">
        <Icon name="close" size={13} />
      </button>
    </div>
  )
}

export function InstallNudge() {
  const { toast } = useWG()
  const [ready, setReady] = useState(false)
  const [show, setShow] = useState(false)

  useEffect(() => onInstallAvailability(setReady), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isStandalone() || inFrame()) return
    if (sessionStorage.getItem('wg_install_nudge')) return
    const t = setTimeout(() => setShow(true), 1600)
    return () => clearTimeout(t)
  }, [])

  const dismiss = (value = '1') => {
    sessionStorage.setItem('wg_install_nudge', value)
    setShow(false)
  }

  const install = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      toast('WarGrid installed — see you on the home screen', 'success')
      dismiss('installed')
    } else if (outcome === 'unavailable') {
      toast('Use your browser menu → Add to Home screen', 'info')
      dismiss()
    } else dismiss()
  }

  if (!show) return null
  const isIOS = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <div className="nudge" role="dialog" aria-label="Install WarGrid">
      <span className="nudge-glow" />
      <div className="row gap-12" style={{ position: 'relative', zIndex: 2 }}>
        <span className="nudge-ico">
          <Icon name="download" size={19} strokeWidth={2.4} />
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <b className="h-head" style={{ fontSize: 13 }}>
            Take the arena with you
          </b>
          <span className="tiny faint" style={{ display: 'block', marginTop: 3, lineHeight: 1.5 }}>
            {ready
              ? 'Install WarGrid to your home screen — offline cache, room-ID alerts and haptics included.'
              : isIOS
                ? 'Install via Safari: Share → “Add to Home Screen”. Offline cache and full-screen arena included.'
                : 'Install from your browser menu → “Add to Home screen” for the full-screen, offline arena.'}
          </span>
        </div>
      </div>
      <div className="row gap-8" style={{ position: 'relative', zIndex: 2, marginTop: 12 }}>
        <Btn size="sm" variant="ghost" className="grow" onClick={() => dismiss()}>
          Not now
        </Btn>
        <Btn size="sm" variant="primary" className="grow" icon="download" onClick={install}>
          Install app
        </Btn>
      </div>
    </div>
  )
}
