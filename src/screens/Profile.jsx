/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Profile / account hub
   Player identity · war stats · achievements · organiser & admin entry points ·
   notification settings
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useState } from 'react'
import { Icon } from '../icons'
import { Art, Avatar, Badge, Btn, CountUp, Progress, SectionHead, Sheet, StatTile, Toggle } from '../ui'
import { useWG } from '../store'
import { cx, inr } from '../utils'
import { isStandalone, onInstallAvailability, promptInstall } from '../platform'

const ACHIEVEMENTS = [
  { icon: 'crown', label: 'Conqueror', tone: 'gold', sub: 'Season 4' },
  { icon: 'crosshair', label: '1000 kills', tone: 'blue', sub: 'Career' },
  { icon: 'trophy', label: '10 wins', tone: 'green', sub: 'Tournaments' },
  { icon: 'bolt', label: '50 scrims', tone: 'violet', sub: 'Loyalty' },
  { icon: 'shieldCheck', label: 'Clean record', tone: 'blue', sub: 'Fair play' },
]

export default function Profile() {
  const { me, wallet, bookings, teams, navigate, goTab, back, toast, sheet, openSheet, closeSheet, lbPlayers, unread } = useWG()
  const [prefs, setPrefs] = useState({ match: true, room: true, prize: true, newEvents: true, booking: true, marketing: false })

  const rank = lbPlayers.findIndex((p) => p.me) + 1
  const completed = bookings.filter((b) => b.status === 'completed').length
  const wins = bookings.filter((b) => b.result?.position === 1).length

  return (
    <>
      {/* ── header ─────────────────────────────────────────────────────── */}
      <Art variant="art-1" className="profile-head" style={{ height: 236 }}>
        <div style={{ position: 'absolute', top: 10, left: 14, right: 14, zIndex: 8, display: 'flex', gap: 8 }}>
          <button className="back-btn" onClick={back} aria-label="back">
            <Icon name="chevronLeft" strokeWidth={2.4} />
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={() => navigate('notifications')} aria-label="notifications">
              <Icon name="bell" />
              {unread > 0 && <span className="pip" />}
            </button>
            <button className="icon-btn" onClick={() => openSheet({ type: 'editProfile' })} aria-label="edit profile">
              <Icon name="edit" />
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 6, marginTop: 46 }}>
          <div className="row gap-14">
            <Avatar name={me.handle} tone="yellow" size="xl" ring />
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="row gap-8">
                <b className="display truncate" style={{ fontSize: 19 }}>
                  {me.handle.toUpperCase()}
                </b>
                {me.verified && <Icon name="verified" size={16} className="blue" />}
              </div>
              <div className="tiny" style={{ color: 'rgba(255,255,255,.7)', marginTop: 4 }}>
                {me.name} · {me.tag}
              </div>
              <div className="row gap-6" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <Badge tone="yellow" icon="crown">{me.tier}</Badge>
                <Badge tone="blue">LVL {me.level}</Badge>
                <Badge tone="green" icon="pin">{me.region}</Badge>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="row-between" style={{ marginBottom: 4 }}>
              <span className="kicker" style={{ color: 'rgba(255,255,255,.6)' }}>Level {me.level} → {me.level + 1}</span>
              <span className="tiny" style={{ color: 'var(--yellow)' }}>{me.xp}%</span>
            </div>
            <div className="tier-bar">
              <i style={{ width: `${me.xp}%` }} />
            </div>
          </div>
        </div>
      </Art>

      <div className="page" style={{ marginTop: -18, position: 'relative', zIndex: 6 }}>
        {/* ── stats ────────────────────────────────────────────────────── */}
        <div className="card pad blue-edge">
          <div className="stat-grid">
            <StatTile label="Global rank" value={`#${rank}`} sub={`${me.tierPoints} tier points`} tone="gold" icon="crown" />
            <StatTile label="K/D ratio" value={me.kd} sub={`${me.matches} matches played`} icon="crosshair" />
            <StatTile label="Wins" value={me.wins} sub={`${wins} on WarGrid this season`} tone="green" icon="trophy" />
            <StatTile label="Earnings" value={me.earnings} prefix="₹" sub={`${inr(wallet.balance)} in wallet`} icon="rupee" />
          </div>
          <div className="divider" />
          <div className="row gap-8">
            <Btn size="sm" variant="primary" className="grow" icon="calendar" onClick={() => goTab('matches')}>
              My Matches
            </Btn>
            <Btn size="sm" variant="outline" className="grow" icon="wallet" onClick={() => navigate('wallet')}>
              {inr(wallet.balance)}
            </Btn>
          </div>
        </div>

        {/* ── get the app ──────────────────────────────────────────────── */}
        <InstallCard openSheet={openSheet} />

        {/* ── quick links ──────────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Battle desk" rule />
          <div className="quick-grid">
            {[
              { i: 'users', l: 'Teams', t: 'violet', fn: () => navigate('teams') },
              { i: 'chart', l: 'Ranks', t: 'gold', fn: () => navigate('leaderboard') },
              { i: 'crosshair', l: 'Scrims', t: '', fn: () => goTab('scrims') },
              { i: 'trophy', l: 'Events', t: '', fn: () => goTab('tournaments') },
              { i: 'bell', l: 'Alerts', t: 'green', fn: () => navigate('notifications') },
              { i: 'wallet', l: 'Wallet', t: 'green', fn: () => navigate('wallet') },
              { i: 'ticket', l: 'Bookings', t: '', fn: () => goTab('matches') },
              { i: 'settings', l: 'Settings', t: '', fn: () => openSheet({ type: 'settings' }) },
            ].map((x) => (
              <button className="quick" key={x.l} onClick={x.fn}>
                <span className={cx('qi', x.t === 'gold' && 'gold', x.t === 'green' && 'green', x.t === 'violet' && 'violet')}>
                  <Icon name={x.i} />
                </span>
                <span>{x.l}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── achievements ─────────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Achievements" accent={`${ACHIEVEMENTS.length} unlocked`} rule />
          <div className="card pad">
            <div className="row gap-10" style={{ overflowX: 'auto', paddingBottom: 2 }}>
              {ACHIEVEMENTS.map((a) => (
                <div key={a.label} style={{ flex: '0 0 auto', textAlign: 'center', width: 74 }}>
                  <span
                    className="li"
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 15,
                      display: 'grid',
                      placeItems: 'center',
                      margin: '0 auto 7px',
                      background: a.tone === 'gold' ? 'rgba(232,255,58,.12)' : a.tone === 'green' ? 'rgba(37,224,138,.12)' : a.tone === 'violet' ? 'rgba(155,107,255,.14)' : 'rgba(45,125,255,.14)',
                      border: `1px solid ${a.tone === 'gold' ? 'rgba(232,255,58,.3)' : a.tone === 'green' ? 'rgba(37,224,138,.3)' : a.tone === 'violet' ? 'rgba(155,107,255,.34)' : 'rgba(45,125,255,.3)'}`,
                      color: a.tone === 'gold' ? 'var(--yellow)' : a.tone === 'green' ? 'var(--green)' : a.tone === 'violet' ? '#c4abff' : 'var(--blue-hi)',
                    }}
                  >
                    <Icon name={a.icon} size={20} />
                  </span>
                  <b className="h-head" style={{ fontSize: 10, display: 'block' }}>{a.label}</b>
                  <span className="tiny faint">{a.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── organiser + admin ────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Run battles" rule />
          <div className="col gap-10">
            <div className="hub-card tap" onClick={() => navigate('organizer')}>
              <div className="row gap-12">
                <span className="li" style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(45,125,255,.2)', border: '1px solid rgba(45,125,255,.4)', color: '#fff' }}>
                  <Icon name="headset" size={19} />
                </span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <b className="h-head" style={{ fontSize: 14, display: 'block' }}>Organiser dashboard</b>
                  <span className="tiny" style={{ color: 'var(--muted)' }}>Create scrims &amp; tournaments · release room IDs · publish results</span>
                </div>
                <Icon name="chevronRight" className="faint" />
              </div>
              <div className="row gap-8" style={{ marginTop: 12 }}>
                <Badge tone="blue">5 active events</Badge>
                <Badge tone="green" icon="verified">Verified organiser</Badge>
              </div>
            </div>

            <div className="hub-card red tap" onClick={() => navigate('admin')}>
              <div className="row gap-12">
                <span className="li" style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(255,74,94,.16)', border: '1px solid rgba(255,74,94,.36)', color: '#ff97a3' }}>
                  <Icon name="shield" size={19} />
                </span>
                <div className="grow" style={{ minWidth: 0 }}>
                  <b className="h-head" style={{ fontSize: 14, display: 'block' }}>Admin control room</b>
                  <span className="tiny" style={{ color: 'var(--muted)' }}>Users · verification · approvals · payments · disputes · bans</span>
                </div>
                <Icon name="chevronRight" className="faint" />
              </div>
              <div className="row gap-8" style={{ marginTop: 12 }}>
                <Badge tone="red">6 open disputes</Badge>
                <Badge tone="yellow">4 pending approvals</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* ── notification prefs ───────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Notification settings" rule />
          <div className="card pad">
            {[
              { k: 'match', l: 'Match starting soon', s: '30 min & 10 min before lobby' },
              { k: 'room', l: 'Room ID released', s: 'Push + in-app the second it drops' },
              { k: 'prize', l: 'Prize credited', s: 'Winnings and withdrawals' },
              { k: 'newEvents', l: 'New tournaments', s: 'Curated for your tier & region' },
              { k: 'booking', l: 'Booking updates', s: 'Confirmations, waitlist, cancellations' },
              { k: 'marketing', l: 'Offers & cashback', s: 'Festive deals and partner drops' },
            ].map((p) => (
              <div className="row gap-12" key={p.k} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                <div className="grow">
                  <b className="h-head" style={{ fontSize: 12.8, display: 'block' }}>{p.l}</b>
                  <span className="tiny faint">{p.s}</span>
                </div>
                <Toggle on={prefs[p.k]} onChange={(v) => setPrefs({ ...prefs, [p.k]: v })} label={p.l} />
              </div>
            ))}
          </div>
        </section>

        {/* ── account ──────────────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Account" rule />
          {[
            { i: 'user', l: 'Linked BGMI ID', s: me.bgmiId, fn: () => openSheet({ type: 'editProfile' }) },
            { i: 'shieldCheck', l: 'KYC & withdrawal limit', s: `${wallet.kyc} · ₹50,000/day`, fn: () => navigate('wallet') },
            { i: 'users', l: 'My squads', s: `${teams.length} teams saved`, fn: () => navigate('teams') },
            { i: 'info', l: 'Help & fair-play policy', s: 'Support responds in under 6 hours', fn: () => openSheet({ type: 'settings' }) },
          ].map((r) => (
            <div className="list-row tap" key={r.l} onClick={r.fn}>
              <span className="li">
                <Icon name={r.i} />
              </span>
              <div className="grow" style={{ minWidth: 0 }}>
                <b className="truncate">{r.l}</b>
                <span className="truncate">{r.s}</span>
              </div>
              <Icon name="chevronRight" className="faint chev" />
            </div>
          ))}
          <Btn variant="ghost" size="sm" block icon="logout" style={{ marginTop: 10, color: '#ff8b98' }} onClick={() => toast('Signed out', 'Demo only — your data stays on this device', 'warn')}>
            Sign out
          </Btn>
        </section>

        <footer style={{ textAlign: 'center', padding: '22px 0 6px' }}>
          <div className="kicker" style={{ letterSpacing: '.34em', color: 'var(--yellow)' }}>Play · Compete · Conquer</div>
          <div className="tiny faint" style={{ marginTop: 7 }}>WarGrid v1.0 · Member since {me.joined}</div>
        </footer>
      </div>

      {/* ── edit profile ───────────────────────────────────────────────── */}
      {sheet?.type === 'editProfile' && (
        <Sheet
          title="Player profile"
          subtitle="Shown to organisers on every registration"
          icon="user"
          onClose={closeSheet}
          footer={<Btn variant="primary" icon="check" onClick={() => { closeSheet(); toast('Profile saved', 'Organisers see your updated details', 'success') }}>Save changes</Btn>}
        >
          <div className="row gap-12" style={{ marginBottom: 14 }}>
            <Avatar name={me.handle} tone="yellow" size="lg" ring />
            <div className="grow">
              <b className="h-head" style={{ fontSize: 14 }}>{me.name}</b>
              <div className="tiny faint">@{me.handle} · {me.tag}</div>
              <Btn size="xs" variant="ghost" icon="image" style={{ marginTop: 8 }}>Change avatar</Btn>
            </div>
          </div>
          <div className="field">
            <label>In-game name</label>
            <input className="input" defaultValue={`${me.name.split(' ')[0]} "${me.handle}"`} />
          </div>
          <div className="field">
            <label>BGMI player ID</label>
            <input className="input" defaultValue={me.bgmiId} inputMode="numeric" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Region</label>
              <input className="input" defaultValue={me.region} />
            </div>
            <div className="field">
              <label>Tier</label>
              <input className="input" defaultValue={me.tier} disabled />
            </div>
          </div>
        </Sheet>
      )}

      {/* ── settings ───────────────────────────────────────────────────── */}
      {sheet?.type === 'settings' && (
        <Sheet title="Settings & support" icon="settings" onClose={closeSheet}>
          {[
            { i: 'shieldCheck', l: 'Fair-play policy', s: 'Anti-cheat, device checks, penalty tiers' },
            { i: 'scale', l: 'Dispute process', s: 'File within 48 hours · resolved in 6' },
            { i: 'money', l: 'Payment & refund policy', s: 'Escrow, auto refunds, TDS on winnings' },
            { i: 'phone', l: 'Device & login history', s: '2 devices · Mumbai, IN' },
            { i: 'bell', l: 'Notification preferences', s: 'Managed on the profile screen' },
            { i: 'info', l: 'About WarGrid', s: 'v1.0 · Built for Indian BGMI' },
          ].map((r) => (
            <div className="list-row tap" key={r.l} onClick={() => toast(r.l, 'Opened in demo mode', 'info')}>
              <span className="li"><Icon name={r.i} /></span>
              <div className="grow" style={{ minWidth: 0 }}>
                <b className="truncate">{r.l}</b>
                <span className="truncate">{r.s}</span>
              </div>
              <Icon name="chevronRight" className="faint chev" />
            </div>
          ))}
        </Sheet>
      )}

      {sheet?.type === 'installHelp' && (
        <Sheet title="Install WarGrid" subtitle="30 seconds, then it lives on your home screen" icon="download" onClose={closeSheet}>
          {[
            { t: 'Android · Chrome', s: 'Tap the ⋮ menu → "Add to Home screen" (or "Install app" when offered).' },
            { t: 'iPhone · Safari', s: 'Tap the Share sheet → "Add to Home Screen", then launch WarGrid from the icon.' },
            { t: 'Desktop · Chrome/Edge', s: 'Use the install icon at the right of the address bar.' },
            { t: 'Android APK / Play build', s: 'From the repo: npm run app:android opens the Capacitor project in Android Studio — build the signed APK there.' },
          ].map((r, i) => (
            <div className="row gap-12" key={r.t} style={{ padding: '11px 2px', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <span
                className="n"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  display: 'grid',
                  placeItems: 'center',
                  flex: '0 0 auto',
                  background: 'rgba(45,125,255,.14)',
                  border: '1px solid rgba(45,125,255,.3)',
                  color: 'var(--cyan)',
                  fontFamily: 'var(--font-display)',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {i + 1}
              </span>
              <div className="grow" style={{ minWidth: 0 }}>
                <b className="h-head" style={{ fontSize: 12.5 }}>{r.t}</b>
                <span className="tiny faint" style={{ display: 'block', marginTop: 3, lineHeight: 1.55 }}>{r.s}</span>
              </div>
            </div>
          ))}
          <div className="sheet-foot">
            <Btn variant="ghost" onClick={closeSheet}>
              Later
            </Btn>
            <Btn
              variant="primary"
              icon="download"
              onClick={async () => {
                const outcome = await promptInstall()
                if (outcome === 'accepted') toast('WarGrid installed — see you on the home screen', 'success')
                closeSheet()
              }}
            >
              Install now
            </Btn>
          </div>
        </Sheet>
      )}
    </>
  )
}

/* ── install / installed state card ──────────────────────────────────────── */
function InstallCard({ openSheet }) {
  const { toast } = useWG()
  const [ready, setReady] = useState(false)
  const [installed, setInstalled] = useState(isStandalone())

  useEffect(() => onInstallAvailability(setReady), [])
  useEffect(() => {
    const sync = () => setInstalled(isStandalone())
    window.addEventListener('appinstalled', sync)
    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener?.('change', sync)
    return () => {
      window.removeEventListener('appinstalled', sync)
      mq.removeEventListener?.('change', sync)
    }
  }, [])

  const onInstall = async () => {
    const outcome = await promptInstall()
    if (outcome === 'accepted') toast('WarGrid installed — see you on the home screen', 'success')
    else if (outcome !== 'unavailable') toast('Install dismissed', 'info')
    else openSheet({ type: 'installHelp' })
  }

  return (
    <section className="section" style={{ marginTop: 2 }}>
      <div className={cx('card pad', installed ? 'green-edge' : 'blue-edge')} style={{ padding: 14 }}>
        <div className="row gap-12">
          <span
            className="li"
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              flex: '0 0 auto',
              background: installed ? 'rgba(37,224,138,.12)' : 'rgba(45,125,255,.14)',
              border: `1px solid ${installed ? 'rgba(37,224,138,.32)' : 'rgba(45,125,255,.34)'}`,
              color: installed ? 'var(--green)' : 'var(--cyan)',
            }}
          >
            <Icon name={installed ? 'shieldCheck' : 'download'} size={19} />
          </span>
          <div className="grow" style={{ minWidth: 0 }}>
            <b className="h-head" style={{ fontSize: 13.5 }}>
              {installed ? 'Running as an installed app' : 'Get the WarGrid app'}
            </b>
            <span className="tiny faint" style={{ display: 'block', marginTop: 3, lineHeight: 1.5 }}>
              {installed
                ? 'Full-screen, offline-ready and wired to haptics. Your arena travels with you.'
                : 'One tap from the home screen: full-screen arena, offline cache, room-ID alerts and real haptics.'}
            </span>
          </div>
          {installed ? (
            <Badge tone="green" icon="check">
              Installed
            </Badge>
          ) : (
            <Btn size="sm" variant="primary" icon="download" onClick={onInstall}>
              Install
            </Btn>
          )}
        </div>
      </div>
    </section>
  )
}

