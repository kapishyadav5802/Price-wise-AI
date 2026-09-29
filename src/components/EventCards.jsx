/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — event cards (tournaments, scrims, live matches)
   ══════════════════════════════════════════════════════════════════════════ */
import React from 'react'
import { Icon, MapGlyph } from '../icons'
import { Art, Avatar, Badge, Btn, CdInline, Countdown, LiveBadge, Progress, SlotMeter } from '../ui'
import { cx, fmtWhen, fmtTime, fmtDayLabel, fmtDateShort, inr, inrShort, pct } from '../utils'
import { useWG } from '../store'

/* ── shared bits ────────────────────────────────────────────────────────── */
function ModeBadge({ event }) {
  const tone = event.entryFee ? 'yellow' : 'green'
  return (
    <div className="row gap-6">
      <Badge tone="blue" icon="users">
        {event.mode}
      </Badge>
      <Badge tone={tone}>{event.entryFee ? inr(event.entryFee) : 'FREE'}</Badge>
    </div>
  )
}

function PrizeFlag({ amount, label = 'Prize Pool' }) {
  return (
    <div className="prize-flag">
      <span>{label}</span>
      <b>{inrShort(amount)}</b>
    </div>
  )
}

function OrgLine({ organizer }) {
  return (
    <div className="banner-org">
      <Icon name={organizer.verified ? 'verified' : 'shield'} />
      {organizer.name}
      <span style={{ opacity: 0.6 }}>· ★ {organizer.rating}</span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TOURNAMENT CARD
   ══════════════════════════════════════════════════════════════════════════ */
export function TournamentCard({ event, onOpen, onJoin, wide }) {
  const { clock, bookings } = useWG()
  const registered = bookings.some((b) => b.eventId === event.id && b.status !== 'failed')
  const full = event.slotsFilled >= event.slotsTotal
  const live = event.status === 'live' || new Date(event.startsAt).getTime() <= clock
  const left = Math.max(0, event.slotsTotal - event.slotsFilled)

  return (
    <article className={cx('tcard tap', wide && 'wide')} onClick={() => onOpen?.(event)}>
      <Art variant={event.art} className="tcard-banner">
        <div className="top-row">
          <div className="row gap-6">
            {live ? <LiveBadge /> : <ModeBadge event={event} />}
          </div>
          <PrizeFlag amount={event.prizePool} />
        </div>
        <div className="banner-meta">
          <div style={{ minWidth: 0 }}>
            <div className="banner-title truncate">{event.name}</div>
            <OrgLine organizer={event.organizer} />
          </div>
        </div>
      </Art>

      <div className="tcard-body">
        <div className="tagrow" style={{ marginBottom: 9 }}>
          <span className="mini-tag">
            <Icon name="clock" size={10} /> {fmtWhen(event.startsAt)}
          </span>
          <span className="mini-tag blue">
            <MapGlyph map={event.maps?.[0] || 'Erangel'} size={11} /> {event.maps?.[0]}
            {event.maps?.length > 1 ? ` +${event.maps.length - 1}` : ''}
          </span>
          <span className="mini-tag gold">
            <Icon name="trophy" size={10} /> {event.matches} matches
          </span>
          {event.perKill ? (
            <span className="mini-tag green">
              <Icon name="crosshair" size={10} /> ₹{event.perKill}/kill
            </span>
          ) : null}
        </div>

        <div className="meta-grid">
          <div className="meta-cell">
            <u>Entry</u>
            <b className={event.entryFee ? 'yellow' : 'green'}>{event.entryFee ? inr(event.entryFee) : 'FREE'}</b>
          </div>
          <div className="meta-cell">
            <u>Prize</u>
            <b className="yellow">{inrShort(event.prizePool)}</b>
          </div>
          <div className="meta-cell">
            <u>Slots</u>
            <b className={left <= 5 ? 'red' : 'blue'}>
              {left}/{event.slotsTotal}
            </b>
          </div>
          <div className="meta-cell">
            <u>Squad</u>
            <b>{event.squadSize}p</b>
          </div>
        </div>

        <SlotMeter filled={event.slotsFilled} total={event.slotsTotal} />

        <div className="tcard-foot">
          {!live && (
            <div className="col" style={{ minWidth: 74 }}>
              <span className="kicker" style={{ fontSize: 8 }}>Starts in</span>
              <CdInline target={event.startsAt} />
            </div>
          )}
          <Btn
            variant={registered ? 'ghost' : live ? 'danger' : full ? 'outline' : 'primary'}
            size="sm"
            cut
            icon={registered ? 'checkCircle' : live ? 'live' : full ? 'clock' : 'bolt'}
            onClick={(e) => {
              e.stopPropagation()
              onJoin?.(event)
            }}
          >
            {registered ? 'Registered' : live ? 'Watch Live' : full ? 'Waitlist' : 'Join Now'}
          </Btn>
        </div>
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SCRIM CARD
   ══════════════════════════════════════════════════════════════════════════ */
export function ScrimCard({ event, onOpen, onJoin }) {
  const { clock, bookings } = useWG()
  const full = event.slotsFilled >= event.slotsTotal
  const live = event.status === 'live'
  const done = event.status === 'completed'
  const registered = bookings.some((b) => b.eventId === event.id && b.status !== 'failed')
  const released = event.roomId && new Date(event.releaseAt).getTime() <= clock
  const d = new Date(event.startsAt)

  return (
    <article
      className={cx('scrim-card tap', !event.entryFee && 'gold', full && !done && 'full')}
      onClick={() => onOpen?.(event)}
      style={done ? { opacity: 0.72 } : null}
    >
      <div className="scrim-time">
        {done ? (
          <>
            <b style={{ fontSize: 12, color: 'var(--muted)' }}>ENDED</b>
            <u style={{ color: 'var(--faint)' }}>{fmtDateShort(event.startsAt)}</u>
          </>
        ) : (
          <>
            <b>{fmtTime(d).split(' ')[0]}</b>
            <u>{fmtTime(d).split(' ')[1]} · {fmtDayLabel(d)}</u>
          </>
        )}
        <div className="mapicon">
          <MapGlyph map={event.map || event.maps?.[0]} size={15} />
        </div>
      </div>

      <div className="scrim-body">
        <div className="row gap-8">
          <h4 className="grow truncate">{event.name}</h4>
          {live ? <LiveBadge /> : done ? <Badge tone="grey">Done</Badge> : registered ? <Badge tone="green" icon="check">Booked</Badge> : null}
        </div>

        <div className="tagrow">
          <span className="mini-tag blue">
            <MapGlyph map={event.map || event.maps?.[0]} size={10} /> {event.map || event.maps?.[0]}
          </span>
          <span className="mini-tag">{event.mode}</span>
          <span className="mini-tag gold">{event.entryFee ? `${inr(event.entryFee)} entry` : 'Free entry'}</span>
          {event.prizePool ? <span className="mini-tag green">{inrShort(event.prizePool)} pool</span> : null}
          {event.perKill ? <span className="mini-tag">₹{event.perKill}/kill</span> : null}
          {event.tier ? <span className="mini-tag">{event.tier} tier</span> : null}
        </div>

        <SlotMeter filled={event.slotsFilled} total={event.slotsTotal} label="Lobby" />

        <div className="row gap-8" style={{ marginTop: 11 }}>
          {released && !done ? (
            <span className="mini-tag gold" style={{ gap: 5 }}>
              <Icon name="key" size={10} /> Room {event.roomId}
            </span>
          ) : !done ? (
            <span className="mini-tag" style={{ gap: 5 }}>
              <Icon name="lock" size={10} /> ID in <CdInline target={event.releaseAt} />
            </span>
          ) : null}
          <Btn
            variant={done ? 'ghost' : registered ? 'ghost' : live ? 'danger' : full ? 'outline' : released ? 'yellow' : 'primary'}
            size="sm"
            className="grow"
            icon={done ? 'chart' : registered ? 'checkCircle' : live ? 'live' : full ? 'clock' : released ? 'bolt' : 'crosshair'}
            onClick={(e) => {
              e.stopPropagation()
              onJoin?.(event)
            }}
          >
            {done ? 'View Result' : registered ? 'Booked' : live ? 'Join Live' : full ? 'Waitlist' : released ? 'Join Instantly' : 'Book Slot'}
          </Btn>
        </div>
      </div>
    </article>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   LIVE MATCH CARD
   ══════════════════════════════════════════════════════════════════════════ */
export function LiveMatchCard({ onOpen }) {
  const { live, getEvent } = useWG()
  const event = getEvent(live.eventId)
  const mins = Math.max(1, Math.round((Date.now() - live.startedAt) / 60000))
  const zoneMins = Math.floor(live.zoneTimer / 60000)
  const zoneSec = Math.floor((live.zoneTimer % 60000) / 1000)

  return (
    <div className="live-card tap" onClick={() => onOpen?.(event || { id: live.eventId })} style={{ cursor: 'pointer' }}>
      <div className="row gap-10">
        <LiveBadge label="Live Now" />
        <span className="kicker" style={{ marginLeft: 'auto' }}>{live.match}</span>
      </div>
      <div className="h-head" style={{ fontSize: 15, marginTop: 9 }}>
        {live.name}
      </div>
      <div className="row gap-6" style={{ marginTop: 6 }}>
        <span className="mini-tag blue">
          <MapGlyph map={live.map} size={10} /> {live.map}
        </span>
        <span className="mini-tag">
          <Icon name="clock" size={10} /> {mins} min in
        </span>
        <span className="mini-tag">
          <Icon name="eye" size={10} /> {live.viewers.toLocaleString('en-IN')} watching
        </span>
      </div>

      <div className="live-stats">
        <div className="live-stat">
          <u>Alive</u>
          <b className="hot">{live.alive}</b>
        </div>
        <div className="live-stat">
          <u>Teams left</u>
          <b>{live.teamsAlive}</b>
        </div>
        <div className="live-stat">
          <u>Total kills</u>
          <b style={{ color: 'var(--yellow)' }}>{live.kills}</b>
        </div>
      </div>

      <div className="row-between" style={{ marginBottom: 7 }}>
        <span className="kicker">Zone {live.phase.replace('Zone ', '')} shrinks in</span>
        <span className="cd-inline" style={{ fontSize: 13, color: 'var(--red)' }}>
          {String(zoneMins).padStart(2, '0')}:{String(zoneSec).padStart(2, '0')}
        </span>
      </div>
      <Progress value={100 - live.alive} max={100} tone="hot" thin />

      <ul className="killfeed" style={{ marginTop: 11 }}>
        {live.feed.map((f, i) => (
          <li key={i}>
            <b>{f.killer}</b>
            <i>
              <Icon name="crosshair" size={10} strokeWidth={2.4} />
            </i>
            <span style={{ color: 'var(--muted)' }}>{f.victim}</span>
            <span className="wep" style={{ marginLeft: 'auto' }}>
              {f.weapon} · {f.zone}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TICKER
   ══════════════════════════════════════════════════════════════════════════ */
export function Ticker({ items }) {
  const doubled = [...items, ...items]
  return (
    <div className="ticker">
      <div className="tick-label">
        <Icon name="bolt" size={10} strokeWidth={2.6} style={{ marginRight: 4 }} /> Feed
      </div>
      <div className="tick-track">
        {doubled.map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPACT ROW (used in "up next" lists)
   ══════════════════════════════════════════════════════════════════════════ */
export function EventRow({ event, onOpen, right }) {
  return (
    <div className="list-row tap" onClick={() => onOpen?.(event)}>
      <span className={cx('li', event.type === 'scrim' ? 'gold' : '')}>
        <Icon name={event.type === 'scrim' ? 'crosshair' : 'trophy'} />
      </span>
      <div className="grow" style={{ minWidth: 0 }}>
        <b className="truncate">{event.name}</b>
        <span className="truncate">
          {fmtWhen(event.startsAt)} · {event.mode} · {event.entryFee ? inr(event.entryFee) : 'Free'}
        </span>
      </div>
      {right || <CdInline target={event.startsAt} />}
    </div>
  )
}
