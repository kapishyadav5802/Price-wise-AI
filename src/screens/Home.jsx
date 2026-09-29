/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Home screen
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon, MapGlyph } from '../icons'
import { Art, Avatar, Badge, Btn, CdInline, Chip, CtaButton, Countdown, EmptyState, Logo, Progress, SearchBar, SectionHead, Sheet, StatTile } from '../ui'
import { EventRow, LiveMatchCard, ScrimCard, Ticker, TournamentCard } from '../components/EventCards'
import { useWG } from '../store'
import { HOME_FILTERS } from '../data'
import { cx, fmtWhen, inr, inrShort } from '../utils'

export default function Home() {
  const {
    tournaments,
    scrims,
    allEvents,
    bookings,
    getEvent,
    me,
    notifs,
    unread,
    navigate,
    goTab,
    wallet,
    lbPlayers,
    openSheet,
    sheet,
    clock,
  } = useWG()

  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')

  /* ── filtering ────────────────────────────────────────────────────────── */
  const match = (e) => {
    const hay = `${e.name} ${e.organizer?.name || ''} ${(e.maps || [e.map]).join(' ')} ${e.mode} ${e.type}`.toLowerCase()
    const okQ = !q || hay.includes(q.toLowerCase().trim())
    let okF = true
    switch (filter) {
      case 'free':
        okF = !e.entryFee
        break
      case 'paid':
        okF = e.entryFee > 0
        break
      case 'scrims':
        okF = e.type === 'scrim'
        break
      case 'tournament':
        okF = e.type === 'tournament'
        break
      case 'solo':
      case 'duo':
      case 'squad':
        okF = e.mode.toLowerCase() === filter
        break
      case 'live':
        okF = e.status === 'live'
        break
      default:
        okF = true
    }
    return okQ && okF
  }

  const searching = q.trim() !== '' || filter !== 'all'

  const featured = useMemo(
    () => tournaments.filter(match).filter((t) => t.status !== 'completed').sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.prizePool - a.prizePool).slice(0, 6),
    [tournaments, q, filter]
  )
  const upcomingScrims = useMemo(
    () =>
      scrims
        .filter(match)
        .filter((s) => s.status !== 'completed')
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
        .slice(0, 4),
    [scrims, q, filter]
  )
  const liveEvents = useMemo(() => allEvents.filter((e) => e.status === 'live' && match(e)), [allEvents, q, filter])
  const results = useMemo(
    () => allEvents.filter(match).filter((e) => e.status !== 'completed').sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt)),
    [allEvents, q, filter]
  )

  /* ── my next battle ───────────────────────────────────────────────────── */
  const nextBooking = useMemo(() => {
    const upcoming = bookings
      .filter((b) => b.status === 'confirmed')
      .map((b) => ({ b, e: getEvent(b.eventId) }))
      .filter((x) => x.e && new Date(x.e.startsAt).getTime() > clock - 60000)
      .sort((a, b) => new Date(a.e.startsAt) - new Date(b.e.startsAt))
    return upcoming[0]
  }, [bookings, clock, getEvent])

  const openEvent = (e) => navigate('event', { id: e.id })
  const joinEvent = (e) => navigate('booking', { id: e.id })

  const quickBattles = useMemo(
    () =>
      allEvents
        .filter((e) => e.status !== 'completed' && e.status !== 'live')
        .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt))
        .slice(0, 6),
    [allEvents]
  )

  return (
    <>
      {/* ── header ─────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="row gap-10">
          <Logo />
          <div className="grow" />
          <button className="icon-btn" onClick={() => navigate('notifications')} aria-label="notifications">
            <Icon name="bell" />
            {unread > 0 && <span className="pip" />}
          </button>
          <button onClick={() => goTab('profile')} aria-label="profile" style={{ lineHeight: 0 }}>
            <Avatar name={me.handle} tone={me.tone} size="md" ring />
          </button>
        </div>
      </header>

      <div className="page">
        {/* ── hero ─────────────────────────────────────────────────────── */}
        <section className="stagger">
          <div className="kicker blue">India's BGMI battle desk</div>
          <h1 className="hero-title" style={{ marginTop: 6 }}>
            FIND YOUR<span className="l2">NEXT BATTLE</span>
          </h1>
          <p className="hero-sub">
            {liveEvents.length} live right now · {results.length} lobbies open across scrims &amp; tournaments.
          </p>
          <div className="tagline">
            <Icon name="bolt" size={11} strokeWidth={2.6} /> Play. Compete. Conquer.
          </div>
        </section>

        {/* ── search + filters ─────────────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          <SearchBar value={q} onChange={setQ} hint="128 live" />
        </div>
      </div>

      <div className="chip-scroll pad" style={{ marginTop: 12 }}>
        {HOME_FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} yellow={f.id === 'live'} onClick={() => setFilter(f.id)}>
            {f.id === 'live' && <Icon name="live" size={12} />}
            {f.id === 'free' && <Icon name="gift" size={12} />}
            {f.id === 'paid' && <Icon name="rupee" size={12} />}
            {f.id === 'scrims' && <Icon name="crosshair" size={12} />}
            {f.id === 'tournament' && <Icon name="trophy" size={12} />}
            {f.label}
          </Chip>
        ))}
      </div>

      <div className="page" style={{ marginTop: 14 }}>
        {searching ? (
          /* ── search / filter results ─────────────────────────────────── */
          <>
            <SectionHead title="Results" accent={`(${results.length})`} rule action="Clear" onAction={() => { setQ(''); setFilter('all') }} />
            {results.length === 0 ? (
              <EmptyState
                icon="search"
                title="No battles matched"
                body="Try a different map, mode or organiser — or clear the filters to see everything."
                action="Clear filters"
                onAction={() => { setQ(''); setFilter('all') }}
              />
            ) : (
              <div className="stagger col gap-12">
                {results.slice(0, 8).map((e) =>
                  e.type === 'tournament' ? (
                    <TournamentCard key={e.id} event={e} onOpen={openEvent} onJoin={joinEvent} />
                  ) : (
                    <ScrimCard key={e.id} event={e} onOpen={openEvent} onJoin={joinEvent} />
                  )
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* ── main CTA ─────────────────────────────────────────────── */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <CtaButton onClick={() => openSheet({ type: 'quickBattle' })} />
            </div>

            {/* ── your next battle ─────────────────────────────────────── */}
            {nextBooking && (
              <section className="section">
                <SectionHead title="Your next battle" rule action="My Matches" onAction={() => goTab('matches')} />
                <NextBattle booking={nextBooking.b} event={nextBooking.e} onOpen={() => navigate('match', { id: nextBooking.b.id })} />
              </section>
            )}

            {/* ── live now ─────────────────────────────────────────────── */}
            <section className="section">
              <SectionHead title="Live matches" accent={`(${liveEvents.length})`} rule action="Watch all" onAction={() => openEvent(liveEvents[0] || { id: 't0' })} />
              <LiveMatchCard onOpen={openEvent} />
            </section>

            {/* ── ticker ───────────────────────────────────────────────── */}
            <section className="section">
              <Ticker
                items={[
                  <><b>₹5,00,000</b> Conquer Cup S4 · 16 slots left</>,
                  <>Zone Zero Invitational waitlist at <b>41 squads</b></>,
                  <><b>SN1PER_KING</b> just took #1 on the leaderboard</>,
                  <>Erangel Prime Scrim #219 room ID in <b>2h</b></>,
                  <>Prize payout speed: <b>under 24 hrs</b></>,
                ]}
              />
            </section>

            {/* ── featured tournaments ─────────────────────────────────── */}
            <section className="section">
              <SectionHead title="Featured" accent="tournaments" action="See all" onAction={() => goTab('tournaments')} />
            </section>
          </>
        )}
      </div>

      {!searching && (
        <>
          <div className="rail">
            {featured.map((e) => (
              <TournamentCard key={e.id} event={e} onOpen={openEvent} onJoin={joinEvent} />
            ))}
          </div>

          <div className="page">
            {/* ── upcoming scrims ──────────────────────────────────────── */}
            <section className="section">
              <SectionHead title="Upcoming" accent="scrims" rule action="Scrim hub" onAction={() => goTab('scrims')} />
              <div className="stagger col gap-10">
                {upcomingScrims.map((s) => (
                  <ScrimCard key={s.id} event={s} onOpen={openEvent} onJoin={joinEvent} />
                ))}
              </div>
            </section>

            {/* ── quick actions ────────────────────────────────────────── */}
            <section className="section">
              <SectionHead title="Battle desk" rule />
              <div className="quick-grid">
                <Quick icon="calendar" label="My Matches" tone="blue" onClick={() => goTab('matches')} />
                <Quick icon="users" label="Teams" tone="violet" onClick={() => navigate('teams')} />
                <Quick icon="chart" label="Ranks" tone="gold" onClick={() => navigate('leaderboard')} />
                <Quick icon="wallet" label="Wallet" tone="green" onClick={() => navigate('wallet')} />
              </div>
            </section>

            {/* ── wallet + rank snapshot ───────────────────────────────── */}
            <section className="section">
              <SectionHead title="Your war stats" rule action="Profile" onAction={() => goTab('profile')} />
              <div className="stat-grid">
                <StatTile label="Wallet balance" value={wallet.balance} prefix="₹" sub={`${inr(wallet.winnings)} lifetime winnings`} tone="green" icon="wallet" />
                <StatTile label="Global rank" value={`#${lbPlayers.findIndex((p) => p.me) + 1 || '—'}`} sub={`${me.kd} K/D · ${me.tier}`} icon="crown" />
                <StatTile label="Matches booked" value={bookings.length} sub={`${bookings.filter((b) => b.status === 'confirmed').length} upcoming`} icon="ticket" />
                <StatTile label="Prize earned" value={me.earnings} prefix="₹" sub="Season 4 to date" tone="gold" icon="trophy" />
              </div>
            </section>

            {/* ── leaderboard teaser ───────────────────────────────────── */}
            <section className="section">
              <SectionHead title="Top fraggers" accent="this week" rule action="Full board" onAction={() => navigate('leaderboard')} />
              <div className="card pad">
                {lbPlayers.slice(0, 4).map((p, i) => (
                  <div className="member-row" key={p.id}>
                    <span className="rk num" style={{ width: 20, color: i === 0 ? 'var(--yellow)' : 'var(--faint)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12 }}>
                      {i + 1}
                    </span>
                    <Avatar name={p.name} tone={i === 0 ? 'yellow' : i === 1 ? 'cyan' : 'violet'} size="sm" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="truncate" style={{ fontSize: 12.5, fontFamily: 'var(--font-head)' }}>
                        {p.name} {p.me && <span className="captain-badge" style={{ marginLeft: 5 }}>YOU</span>}
                      </b>
                      <span style={{ fontSize: 10.5, color: 'var(--faint)' }}>{p.team}</span>
                    </div>
                    <div className="col" style={{ alignItems: 'flex-end' }}>
                      <b className="num" style={{ fontSize: 12.5, color: 'var(--yellow)' }}>{p.kills.toLocaleString('en-IN')}</b>
                      <span style={{ fontSize: 9.5, color: 'var(--faint)', letterSpacing: '.12em', textTransform: 'uppercase' }}>kills</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── footer ───────────────────────────────────────────────── */}
            <footer style={{ textAlign: 'center', padding: '26px 0 8px' }}>
              <Logo />
              <div className="kicker" style={{ marginTop: 12, letterSpacing: '.34em' }}>Play · Compete · Conquer</div>
              <div style={{ fontSize: 10.5, color: 'var(--faint)', marginTop: 8 }}>
                WarGrid v1.0 · Built for Indian BGMI · Fair-play verified lobbies
              </div>
            </footer>
          </div>
        </>
      )}

      {/* ── quick battle sheet ─────────────────────────────────────────── */}
      {sheet?.type === 'quickBattle' && <QuickBattleSheet battles={quickBattles} onOpen={openEvent} onJoin={joinEvent} />}
    </>
  )
}

/* ── sub-components ─────────────────────────────────────────────────────── */
function Quick({ icon, label, tone, onClick }) {
  return (
    <button className="quick" onClick={onClick}>
      <span className={cx('qi', tone === 'gold' && 'gold', tone === 'green' && 'green', tone === 'violet' && 'violet')}>
        <Icon name={icon} />
      </span>
      <span>{label}</span>
    </button>
  )
}

function NextBattle({ booking, event, onOpen }) {
  const { clock, teams } = useWG()
  const team = teams.find((t) => t.id === booking.teamId)
  const released = booking.roomId || (event.roomId && new Date(event.releaseAt).getTime() <= clock)
  return (
    <div className={cx('card pad', 'blue-edge tap')} onClick={onOpen}>
      <div className="row gap-10">
        <span className="li" style={{ width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(45,125,255,.14)', border: '1px solid rgba(45,125,255,.28)', color: 'var(--blue-hi)' }}>
          <Icon name={event.type === 'scrim' ? 'crosshair' : 'trophy'} />
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <b className="truncate" style={{ fontFamily: 'var(--font-head)', fontSize: 14 }}>
            {event.name}
          </b>
          <span className="truncate" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {fmtWhen(event.startsAt)} · {team?.name || 'Squad'}
          </span>
        </div>
        <Icon name="chevronRight" className="faint" size={16} />
      </div>
      <div className="row gap-12" style={{ marginTop: 13 }}>
        <Countdown target={event.startsAt} size="sm" />
        <div className="grow">
          <div className={cx('room-cell', !released && 'locked')} style={{ padding: '9px 11px' }}>
            <u>{released ? 'Room ID' : 'Room ID locked'}</u>
            <b style={{ fontSize: 15 }}>
              {released ? (
                booking.roomId || event.roomId
              ) : (
                <>
                  Releases in <CdInline target={event.releaseAt} />
                </>
              )}
            </b>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickBattleSheet({ battles, onOpen, onJoin }) {
  const { closeSheet } = useWG()
  return (
    <Sheet title="Book your battle" subtitle="Next 6 lobbies by start time" icon="bolt" onClose={closeSheet}>
      <div className="col gap-8">
        {battles.map((e) => (
          <div className="list-row tap" key={e.id}>
            <span className={cx('li', e.type === 'scrim' ? 'gold' : '')}>
              <Icon name={e.type === 'scrim' ? 'crosshair' : 'trophy'} />
            </span>
            <div className="grow" style={{ minWidth: 0 }}>
              <b className="truncate">{e.name}</b>
              <span className="truncate">
                {fmtWhen(e.startsAt)} · {e.entryFee ? inr(e.entryFee) : 'Free'} · {inrShort(e.prizePool)}
              </span>
            </div>
            <Btn
              size="xs"
              variant="primary"
              onClick={() => {
                closeSheet()
                onJoin(e)
              }}
            >
              Book
            </Btn>
          </div>
        ))}
      </div>
    </Sheet>
  )
}
