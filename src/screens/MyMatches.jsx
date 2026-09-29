/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — My Matches
   Upcoming · registered tournaments · scrims · room ID + password ·
   team members · results · points · position
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon } from '../icons'
import { Avatar, Badge, Btn, CdInline, Countdown, EmptyState, Progress, SectionHead, StatTile, Tabs } from '../ui'
import { useWG } from '../store'
import { cx, fmtWhen, inr, relTime, sum } from '../utils'

export default function MyMatches() {
  const { bookings, getEvent, teams, navigate, clock, live, wallet, me } = useWG()
  const [tab, setTab] = useState('upcoming')

  const enriched = useMemo(
    () =>
      bookings
        .map((b) => ({ b, e: getEvent(b.eventId), team: teams.find((t) => t.id === b.teamId) }))
        .filter((x) => x.e)
        .sort((a, b) => new Date(a.e.startsAt) - new Date(b.e.startsAt)),
    [bookings, getEvent, teams]
  )

  const isLive = (b, e) => e.status === 'live' || live.eventId === e.id || (new Date(e.startsAt).getTime() < clock && new Date(e.endsAt || e.startsAt).getTime() > clock && b.status === 'confirmed')
  const isDone = (b, e) => b.status === 'completed' || e.status === 'completed'

  const groups = {
    upcoming: enriched.filter(({ b, e }) => b.status === 'confirmed' && !isLive(b, e) && !isDone(b, e)),
    live: enriched.filter(({ b, e }) => b.status === 'confirmed' && isLive(b, e)),
    tournaments: enriched.filter(({ b }) => b.eventType === 'tournament' && b.status !== 'waitlist'),
    scrims: enriched.filter(({ b }) => b.eventType === 'scrim'),
    completed: enriched.filter(({ b, e }) => b.status === 'completed' || isDone(b, e)),
    waitlist: enriched.filter(({ b }) => b.status === 'waitlist'),
  }
  const list = groups[tab] || []

  const next = groups.upcoming[0] || groups.live[0]
  const totalWon = sum(bookings.filter((b) => b.result), (b) => b.result?.earned || 0)
  const avgPos = groups.completed.length ? (sum(groups.completed, ({ b }) => b.result?.position || 0) / groups.completed.length).toFixed(1) : '—'
  const totalKills = sum(bookings.filter((b) => b.result), (b) => b.result?.kills || 0)

  return (
    <>
      <header className="app-header">
        <div className="row gap-10">
          <div className="grow">
            <div className="kicker blue">Match centre</div>
            <div className="display" style={{ fontSize: 22, marginTop: 3 }}>
              MY <span className="grad-text-blue">BATTLES</span>
            </div>
          </div>
          <button className="icon-btn" onClick={() => navigate('notifications')} aria-label="notifications">
            <Icon name="bell" />
          </button>
          <button className="icon-btn" onClick={() => navigate('wallet')} aria-label="wallet">
            <Icon name="wallet" />
          </button>
        </div>

        {next && (
          <div className="card pad blue-edge" style={{ marginTop: 13 }}>
            <div className="row gap-8">
              <Badge tone={tab === 'live' ? 'red' : 'blue'} icon={isLive(next.b, next.e) ? 'live' : 'clock'}>
                {isLive(next.b, next.e) ? 'Live now' : 'Up next'}
              </Badge>
              <span className="kicker" style={{ marginLeft: 'auto' }}>{relTime(next.e.startsAt)}</span>
            </div>
            <div className="h-head" style={{ fontSize: 15, marginTop: 9 }}>{next.e.name}</div>
            <div className="tiny muted" style={{ marginTop: 3 }}>
              {fmtWhen(next.e.startsAt)} · {next.team?.name || 'Solo'} · {next.b.players?.length || 0} players
            </div>
            <div className="row gap-12" style={{ marginTop: 12 }}>
              <Countdown target={next.e.startsAt} gold size="sm" />
              <Btn size="sm" variant="primary" cut className="grow" iconRight="chevronRight" onClick={() => navigate('match', { id: next.b.id })}>
                Open
              </Btn>
            </div>
          </div>
        )}
      </header>

      <div className="page">
        <div className="stat-grid three" style={{ marginBottom: 14 }}>
          <StatTile label="Booked" value={bookings.filter((b) => b.status === 'confirmed').length} sub="active entries" icon="ticket" />
          <StatTile label="Prize won" value={totalWon} prefix="₹" sub="lifetime on WarGrid" tone="gold" icon="trophy" />
          <StatTile label="Avg position" value={avgPos} sub={`${totalKills} kills recorded`} tone="green" icon="chart" />
        </div>

        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { id: 'upcoming', label: `Upcoming ${groups.upcoming.length}` },
            { id: 'live', label: 'Live' },
            { id: 'completed', label: 'Results' },
            { id: 'waitlist', label: 'Waitlist' },
          ]}
        />

        {['upcoming', 'tournaments', 'scrims'].includes(tab) && (
          <div className="row gap-8" style={{ marginBottom: 12 }}>
            <ChipLink active={tab === 'tournaments'} onClick={() => setTab('tournaments')} label={`Tournaments · ${groups.tournaments.length}`} />
            <ChipLink active={tab === 'scrims'} onClick={() => setTab('scrims')} label={`Scrims · ${groups.scrims.length}`} />
            <ChipLink active={false} onClick={() => setTab('upcoming')} label="Everything" />
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState
            icon={tab === 'completed' ? 'chart' : 'calendar'}
            title={tab === 'completed' ? 'No results yet' : tab === 'waitlist' ? 'No waitlist entries' : 'No upcoming battles'}
            body={
              tab === 'completed'
                ? 'Once a lobby ends, your position, kills, points and prize land here automatically.'
                : 'Book a scrim or tournament and it will show up here with the room ID the moment it drops.'
            }
            action="Find a battle"
            onAction={() => navigate('tournaments')}
          />
        ) : (
          <div className="stagger col gap-10">
            {list.map(({ b, e, team }) => (
              <MatchCard key={b.id} booking={b} event={e} team={team} onOpen={() => navigate('match', { id: b.id })} live={isLive(b, e)} done={isDone(b, e)} clock={clock} />
            ))}
          </div>
        )}

        <div style={{ height: 8 }} />
      </div>
    </>
  )
}

function ChipLink({ active, onClick, label }) {
  return (
    <button className={cx('chip', active && 'active')} onClick={onClick}>
      {label}
    </button>
  )
}

/* ── match card ─────────────────────────────────────────────────────────── */
export function MatchCard({ booking, event, team, onOpen, live, done, clock }) {
  const released = Boolean(booking.roomId || event.roomId) && new Date(booking.releaseAt || event.releaseAt || event.startsAt).getTime() <= clock
  const roomId = booking.roomId || event.roomId
  const roomPass = booking.roomPass || event.roomPass

  return (
    <article className={cx('match-card tap', live && 'live', done && 'done')} onClick={onOpen}>
      <span className="strip" />
      <div className="row gap-8">
        <span className="li" style={{ width: 36, height: 36, borderRadius: 12, display: 'grid', placeItems: 'center', background: event.type === 'scrim' ? 'rgba(232,255,58,.12)' : 'rgba(45,125,255,.14)', border: `1px solid ${event.type === 'scrim' ? 'rgba(232,255,58,.28)' : 'rgba(45,125,255,.28)'}`, color: event.type === 'scrim' ? 'var(--yellow)' : 'var(--blue-hi)' }}>
          <Icon name={event.type === 'scrim' ? 'crosshair' : 'trophy'} size={16} />
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <b className="truncate" style={{ fontFamily: 'var(--font-head)', fontSize: 13.5 }}>{event.name}</b>
          <span className="truncate" style={{ fontSize: 11, color: 'var(--muted)' }}>
            {fmtWhen(event.startsAt)} · {event.mode} · {team?.name || 'Solo'}
          </span>
        </div>
        {live ? <Badge tone="red" icon="live">Live</Badge> : done ? <Badge tone="grey">Done</Badge> : booking.status === 'waitlist' ? <Badge tone="yellow">Waitlist</Badge> : <CdInline target={event.startsAt} />}
      </div>

      {/* team members */}
      {booking.players?.length > 0 && (
        <div className="row gap-8" style={{ marginTop: 11 }}>
          <div className="row gap-4">
            {booking.players.slice(0, 4).map((p, i) => (
              <Avatar key={i} name={p.name} tone={p.captain ? 'yellow' : 'blue'} size="sm" />
            ))}
          </div>
          <span className="tiny faint grow truncate">
            {booking.players.map((p) => p.name.split('"')[1] || p.name.split(' ')[0]).join(' · ')}
          </span>
          <span className="tiny faint">{booking.players.length}p</span>
        </div>
      )}

      {/* room credentials */}
      {!done && (
        <div className={cx('room-grid', 'row')} style={{ gridTemplateColumns: '1fr 1fr', marginTop: 11 }}>
          <div className={cx('room-cell', !released && 'locked')} style={{ textAlign: 'left' }}>
            <u>Room ID</u>
            <b className={cx(!released && 'blurred')} style={{ fontSize: 16 }}>{released ? roomId : '••••••••'}</b>
          </div>
          <div className={cx('room-cell', !released && 'locked')} style={{ textAlign: 'left' }}>
            <u>Password</u>
            <b className={cx(!released && 'blurred')} style={{ fontSize: 16 }}>{released ? roomPass : '••••••'}</b>
          </div>
        </div>
      )}

      {/* results */}
      {done && booking.result && (
        <div className="result-grid">
          <div className="result-cell"><u>Position</u><b className={booking.result.position === 1 ? 'gold' : 'blue'}>#{booking.result.position}</b></div>
          <div className="result-cell"><u>Kills</u><b className="gold">{booking.result.kills}</b></div>
          <div className="result-cell"><u>Points</u><b className="green">{booking.result.points}</b></div>
          <div className="result-cell"><u>Won</u><b className={booking.result.earned ? 'gold' : ''}>{booking.result.earned ? inr(booking.result.earned) : '—'}</b></div>
        </div>
      )}

      {done && !booking.result && (
        <div className="tiny faint" style={{ marginTop: 10 }}>
          <Icon name="clock" size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> Awaiting official points table from the organiser
        </div>
      )}

      <div className="row gap-8" style={{ marginTop: 12 }}>
        {booking.status === 'waitlist' ? (
          <span className="tiny faint grow">Waitlist position #{booking.waitlistPos} · auto-books if a squad drops</span>
        ) : (
          <span className="tiny faint grow">
            {released ? 'Credentials live · join before the lobby closes' : `Room ID ${relTime(booking.releaseAt || event.releaseAt || event.startsAt)}`}
          </span>
        )}
        <Btn size="xs" variant={live ? 'danger' : done ? 'ghost' : 'primary'} iconRight="chevronRight" onClick={(e) => { e.stopPropagation(); onOpen() }}>
          {live ? 'Match centre' : done ? 'Result' : 'Details'}
        </Btn>
      </div>
    </article>
  )
}
