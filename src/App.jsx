/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — app shell
   9:16 device frame · status bar · router · bottom navigation · toasts
   PLAY. COMPETE. CONQUER.
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { OverlayCtx } from './overlay'
import { Icon, SignalIcon, LogoMark } from './icons'
import { WarGridProvider, useWG, clockTime } from './store'
import { Btn } from './ui'
import { FrameBanner, InstallNudge } from './components/InstallPrompts'
import { cx, pad2 } from './utils'
import { isStandalone } from './platform'

import Home from './screens/Home'
import Scrims from './screens/Scrims'
import Tournaments from './screens/Tournaments'
import EventDetail from './screens/EventDetail'
import Booking from './screens/Booking'
import MyMatches from './screens/MyMatches'
import MatchDetail from './screens/MatchDetail'
import Teams from './screens/Teams'
import Leaderboard from './screens/Leaderboard'
import Wallet from './screens/Wallet'
import Notifications from './screens/Notifications'
import Profile from './screens/Profile'
import Organizer from './screens/Organizer'
import Admin from './screens/Admin'

const TABS = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'scrims', label: 'Scrims', icon: 'crosshair' },
  { id: 'tournaments', label: 'Events', icon: 'trophy' },
  { id: 'matches', label: 'Matches', icon: 'calendar' },
  { id: 'profile', label: 'Profile', icon: 'user' },
]

export default function App() {
  return (
    <WarGridProvider>
      <Stage />
    </WarGridProvider>
  )
}

/* ── stage: scales the phone so the whole 9:16 canvas always fits ───────── */
function Stage() {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const fit = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      if (isStandalone() || w <= 640 || h < 600) {
        document.body.classList.add('fullbleed')
        setScale(1)
      } else {
        document.body.classList.remove('fullbleed')
        setScale(Math.min(1.06, (w - 96) / 402, (h - 56) / 874))
      }
    }
    fit()
    window.addEventListener('resize', fit)
    window.addEventListener('orientationchange', fit)
    return () => {
      window.removeEventListener('resize', fit)
      window.removeEventListener('orientationchange', fit)
    }
  }, [])

  return (
    <div className="stage">
      <div className="stage-brand">
        <h1>
          WAR<em>GRID</em>
        </h1>
        <p>Play · Compete · Conquer</p>
      </div>
      <div className="stage-hint">
        <span className="dot" /> BGMI scrims &amp; tournament booking · 9:16
      </div>

      <div className="device-wrap" style={{ transform: `scale(${scale})` }}>
        <div className="device">
          <div className="device-screen">
            <div className="island" />
            <Phone />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── the phone itself ───────────────────────────────────────────────────── */
function Phone() {
  const { route, dir, tab, goTab, unread, bookings, clock, toasts, allEvents, navigate } = useWG()
  const scrollRef = useRef(null)
  const [overlayEl, setOverlayEl] = useState(null)

  const rKey = route.key || route.screen + JSON.stringify(route.params || {})

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [rKey])

  const activeTab = TABS.some((t) => t.id === route.screen) ? route.screen : tab
  const upcomingCount = bookings.filter((b) => b.status === 'confirmed').length

  /* next bookable battle — powers the floating CTA */
  const nextBattle = useMemo(
    () =>
      allEvents
        .filter((e) => e.status !== 'completed' && e.status !== 'live' && e.slotsFilled < e.slotsTotal)
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))[0],
    [allEvents]
  )
  /* the booking flow goes full-screen (no tab bar) so the player can focus */
  const hideNav = route.screen === 'booking'
  const showFab = !hideNav && ['scrims', 'tournaments'].includes(route.screen)

  return (
    <OverlayCtx.Provider value={overlayEl}>
      <div className="app">
        <StatusBar clock={clock} />

        <div className={cx('viewport', hideNav && 'no-nav')} ref={scrollRef}>
          <div className={cx('route', dir)} key={rKey}>
            <Router route={route} />
          </div>
        </div>

        {showFab && nextBattle && (
          <button className="fab" onClick={() => navigate('booking', { id: nextBattle.id })}>
            <Icon name="bolt" strokeWidth={2.6} /> Book your battle
          </button>
        )}

        {!hideNav && <BottomNav active={activeTab} onTab={goTab} unread={unread} matches={upcomingCount} />}
        <InstallNudge />
        <FrameBanner />
        <ToastLayer toasts={toasts} />
        <div className="overlay-root" ref={setOverlayEl} />
      </div>
    </OverlayCtx.Provider>
  )
}

function Router({ route }) {
  const p = route.params || {}
  switch (route.screen) {
    case 'home':
      return <Home />
    case 'scrims':
      return <Scrims />
    case 'tournaments':
      return <Tournaments />
    case 'matches':
      return <MyMatches />
    case 'profile':
      return <Profile />
    case 'event':
      return <EventDetail id={p.id} />
    case 'booking':
      return <Booking id={p.id} />
    case 'match':
      return <MatchDetail id={p.id} />
    case 'teams':
      return <Teams create={p.create} />
    case 'leaderboard':
      return <Leaderboard />
    case 'wallet':
      return <Wallet />
    case 'notifications':
      return <Notifications />
    case 'organizer':
      return <Organizer />
    case 'admin':
      return <Admin />
    default:
      return <Home />
  }
}

/* ── status bar ─────────────────────────────────────────────────────────── */
function StatusBar({ clock }) {
  const d = new Date(clock)
  let h = d.getHours()
  const ap = h >= 12 ? '' : ''
  h = h % 12 || 12
  return (
    <div className="statusbar">
      <span className="mono">
        {h}:{pad2(d.getMinutes())}
      </span>
      <span className="sb-right">
        <SignalIcon />
        <Icon name="wifi" size={14} />
        <span className="sb-battery">
          <i />
        </span>
      </span>
    </div>
  )
}

/* ── bottom navigation ──────────────────────────────────────────────────── */
function BottomNav({ active, onTab, unread, matches }) {
  return (
    <nav className="bottomnav">
      {TABS.map((t) => (
        <button key={t.id} className={cx('nav-item', active === t.id && 'active')} onClick={() => onTab(t.id)} aria-label={t.label} aria-current={active === t.id}>
          <Icon name={t.icon} />
          <span>{t.label}</span>
          {t.id === 'profile' && unread > 0 && <span className="nav-badge">{unread > 9 ? '9+' : unread}</span>}
          {t.id === 'matches' && matches > 0 && <span className="nav-badge yellow">{matches}</span>}
        </button>
      ))}
    </nav>
  )
}

/* ── toasts ─────────────────────────────────────────────────────────────── */
const TOAST_ICON = { success: 'checkCircle', info: 'info', warn: 'alert', error: 'alert' }
function ToastLayer({ toasts }) {
  return (
    <div className="toast-layer">
      {toasts.map((t) => (
        <div key={t.id} className={cx('toast', t.tone)}>
          <span className="ti">
            <Icon name={TOAST_ICON[t.tone] || 'info'} strokeWidth={2.4} />
          </span>
          <span className="grow" style={{ minWidth: 0 }}>
            <b className="truncate">{t.title}</b>
            {t.sub && <span className="truncate">{t.sub}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
