/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Tournament discovery
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon, MapGlyph } from '../icons'
import { Art, Avatar, Badge, Btn, CdInline, Countdown, EmptyState, Progress, SearchBar, SectionHead, StatTile, Tabs } from '../ui'
import { FilterSheet, SortBar } from '../components/Filters'
import { TournamentCard } from '../components/EventCards'
import { useWG } from '../store'
import { MODES, ORGANIZERS } from '../data'
import { DAY, HOUR, cx, fmtDate, fmtTime, inr, inrShort, pct, sum } from '../utils'

const DEFAULTS = { prize: 'any', fee: 'any', mode: [], when: 'any', format: [] }

export default function Tournaments() {
  const { tournaments, bookings, navigate, openSheet, closeSheet, sheet, clock } = useWG()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('all')
  const [filters, setFilters] = useState(DEFAULTS)
  const [sort, setSort] = useState('prize')

  /* ── pipeline ─────────────────────────────────────────────────────────── */
  const list = useMemo(() => {
    let out = tournaments.filter((t) => {
      if (q && !`${t.name} ${t.organizer.name} ${(t.maps || []).join(' ')} ${t.mode} ${t.subtitle}`.toLowerCase().includes(q.toLowerCase())) return false

      if (tab === 'free' && t.entryFee > 0) return false
      if (tab === 'paid' && t.entryFee === 0) return false
      if (tab === 'live' && t.status !== 'live') return false
      if (tab === 'registered' && !bookings.some((b) => b.eventId === t.id)) return false
      if (tab === 'filling' && (t.slotsTotal - t.slotsFilled) / t.slotsTotal > 0.15) return false
      if (tab === 'all' && t.status === 'completed') return false

      if (filters.prize === '50k' && t.prizePool < 50000) return false
      if (filters.prize === '1l' && t.prizePool < 100000) return false
      if (filters.prize === '5l' && t.prizePool < 500000) return false
      if (filters.fee === 'free' && t.entryFee > 0) return false
      if (filters.fee === 'u100' && t.entryFee > 100) return false
      if (filters.fee === 'u250' && t.entryFee > 250) return false
      if (filters.mode.length && !filters.mode.includes(t.mode)) return false

      const dt = new Date(t.startsAt).getTime() - clock
      if (filters.when === '24h' && dt > DAY) return false
      if (filters.when === 'week' && dt > 7 * DAY) return false
      if (filters.when === 'month' && dt > 30 * DAY) return false
      return true
    })

    const by = {
      prize: (a, b) => b.prizePool - a.prizePool,
      date: (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
      fee: (a, b) => a.entryFee - b.entryFee,
      slots: (a, b) => a.slotsTotal - a.slotsFilled - (b.slotsTotal - b.slotsFilled),
      rating: (a, b) => b.organizer.rating - a.organizer.rating,
    }
    return out.sort(by[sort] || by.prize)
  }, [tournaments, q, tab, filters, sort, bookings, clock])

  /* spotlight = biggest prize pool that is still open */
  const spotlight = useMemo(() => {
    const open = tournaments.filter((t) => t.status !== 'completed')
    return [...open].sort((a, b) => b.prizePool - a.prizePool)[0]
  }, [tournaments])

  const totalPool = sum(tournaments.filter((t) => t.status !== 'completed'), (t) => t.prizePool)
  const openEvent = (e) => navigate('event', { id: e.id })
  const joinEvent = (e) => navigate('booking', { id: e.id })

  const sections = [
    {
      key: 'prize',
      label: 'Prize pool',
      icon: 'trophy',
      type: 'single',
      options: [
        { id: 'any', label: 'Any' },
        { id: '50k', label: '₹50K +' },
        { id: '1l', label: '₹1L +' },
        { id: '5l', label: '₹5L +' },
      ],
    },
    {
      key: 'fee',
      label: 'Entry fee',
      icon: 'rupee',
      type: 'single',
      options: [
        { id: 'any', label: 'Any' },
        { id: 'free', label: 'Free only' },
        { id: 'u100', label: 'Under ₹100' },
        { id: 'u250', label: 'Under ₹250' },
      ],
    },
    { key: 'mode', label: 'Squad size', icon: 'users', type: 'multi', options: MODES.map((m) => ({ id: m, label: m })) },
    {
      key: 'when',
      label: 'Starts',
      icon: 'clock',
      type: 'single',
      options: [
        { id: 'any', label: 'Any time' },
        { id: '24h', label: 'Next 24 hrs' },
        { id: 'week', label: 'This week' },
        { id: 'month', label: 'This month' },
      ],
    },
  ]

  const activeFilters =
    (filters.prize !== 'any' ? 1 : 0) + (filters.fee !== 'any' ? 1 : 0) + filters.mode.length + (filters.when !== 'any' ? 1 : 0)

  return (
    <>
      <header className="app-header">
        <div className="row gap-10">
          <div className="grow">
            <div className="kicker blue">Tournament arena</div>
            <div className="display" style={{ fontSize: 22, marginTop: 3 }}>
              CONQUER <span className="grad-text-blue">CIRCUIT</span>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => openSheet({ type: 'tourFilters' })}
            aria-label="filters"
            style={activeFilters ? { borderColor: 'rgba(232,255,58,.5)', color: 'var(--yellow)' } : null}
          >
            <Icon name="sliders" />
            {activeFilters > 0 && <span className="pip" style={{ background: 'var(--yellow)', boxShadow: '0 0 10px var(--yellow)' }} />}
          </button>
          <button className="icon-btn" onClick={() => navigate('leaderboard')} aria-label="leaderboard">
            <Icon name="chart" />
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search tournaments, organisers, maps…" />
        </div>
      </header>

      <div className="page">
        {/* ── spotlight banner ─────────────────────────────────────────── */}
        {!q && tab === 'all' && spotlight && (
          <section style={{ marginBottom: 18 }}>
            <Spotlight event={spotlight} onOpen={openEvent} onJoin={joinEvent} />
          </section>
        )}

        {/* ── circuit stats ────────────────────────────────────────────── */}
        {!q && tab === 'all' && (
          <section style={{ marginBottom: 16 }}>
            <div className="stat-grid three">
              <StatTile label="Prize pool live" value={inrShort(totalPool)} sub="across open events" tone="gold" icon="trophy" />
              <StatTile label="Open events" value={tournaments.filter((t) => t.status !== 'completed').length} sub="registrations live" icon="ticket" />
              <StatTile label="Your entries" value={bookings.filter((b) => b.eventType === 'tournament').length} sub="tournaments booked" tone="green" icon="shieldCheck" />
            </div>
          </section>
        )}

        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { id: 'all', label: 'All' },
            { id: 'free', label: 'Free' },
            { id: 'paid', label: 'Paid' },
            { id: 'filling', label: 'Filling fast' },
            { id: 'registered', label: 'My entries' },
          ]}
        />

        <div style={{ marginBottom: 14 }}>
          <SortBar
            value={sort}
            onChange={setSort}
            options={[
              { id: 'prize', label: 'Prize pool' },
              { id: 'date', label: 'Start date' },
              { id: 'fee', label: 'Entry fee' },
              { id: 'slots', label: 'Slots left' },
              { id: 'rating', label: 'Organiser rating' },
            ]}
          />
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon="trophy"
            title="No tournaments matched"
            body="Try a bigger prize bracket or clear the filters. New circuits are approved every day."
            action="Reset filters"
            onAction={() => { setFilters(DEFAULTS); setQ(''); setTab('all') }}
          />
        ) : (
          <div className="stagger col gap-14">
            {list.map((t) => (
              <TournamentCard key={t.id} event={t} onOpen={openEvent} onJoin={joinEvent} wide />
            ))}
          </div>
        )}

        {/* ── verified organisers ──────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Verified" accent="organisers" rule />
          <div className="card pad">
            {Object.values(ORGANIZERS).map((o) => (
              <div className="member-row" key={o.id}>
                <Avatar name={o.name} tone={o.tone} size="md" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <b className="truncate" style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {o.name}
                    {o.verified ? <Icon name="verified" size={12} className="blue" /> : <Badge tone="grey">Pending</Badge>}
                  </b>
                  <span className="truncate" style={{ fontSize: 10.5 }}>
                    {o.events} events · ★ {o.rating} · {(o.followers / 1000).toFixed(1)}K followers
                  </span>
                </div>
                <Btn size="xs" variant="outline" onClick={() => { setQ(o.name); setTab('all') }}>
                  View
                </Btn>
              </div>
            ))}
          </div>
        </section>
        <div style={{ height: 8 }} />
      </div>

      {sheet?.type === 'tourFilters' && (
        <FilterSheet
          title="Filter tournaments"
          value={filters}
          onChange={setFilters}
          sections={sections}
          onClose={closeSheet}
          onReset={() => setFilters(DEFAULTS)}
          applyLabel={`Show ${list.length} event${list.length === 1 ? '' : 's'}`}
        />
      )}
    </>
  )
}

/* ── spotlight hero ─────────────────────────────────────────────────────── */
function Spotlight({ event, onOpen, onJoin }) {
  const { bookings } = useWG()
  const registered = bookings.some((b) => b.eventId === event.id)
  const left = Math.max(0, event.slotsTotal - event.slotsFilled)
  return (
    <div className="tap" style={{ borderRadius: 24, overflow: 'hidden', cursor: 'pointer' }} onClick={() => onOpen(event)}>
      <Art variant={event.art} style={{ height: 250 }} className="" glow="rgba(232,255,58,.4)">
        <div style={{ position: 'relative', zIndex: 6, height: '100%', display: 'flex', flexDirection: 'column', padding: 15 }}>
          <div className="row gap-8">
            <Badge tone="yellow" icon="crown">
              Headline event
            </Badge>
            <Badge tone="blue">{event.mode}</Badge>
            <div style={{ marginLeft: 'auto' }}>
              <Badge tone={event.organizer.verified ? 'green' : 'grey'} icon={event.organizer.verified ? 'verified' : 'shield'}>
                {event.organizer.verified ? 'Verified' : 'Unverified'}
              </Badge>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div className="kicker" style={{ color: 'rgba(255,255,255,.62)' }}>
              {event.organizer.name} presents
            </div>
            <h2 className="display" style={{ fontSize: 22, marginTop: 5, textShadow: '0 4px 22px rgba(0,0,0,.85)' }}>
              {event.name}
            </h2>
            <div className="row gap-8" style={{ marginTop: 9, flexWrap: 'wrap' }}>
              <span className="mini-tag">
                <Icon name="calendar" size={10} /> {fmtDate(event.startsAt)} · {fmtTime(event.startsAt)}
              </span>
              <span className="mini-tag blue">
                <MapGlyph map={event.maps?.[0]} size={10} /> {event.maps?.length} maps
              </span>
              <span className="mini-tag gold">
                <Icon name="trophy" size={10} /> {event.matches} matches
              </span>
            </div>

            <div className="row gap-10" style={{ marginTop: 13 }}>
              <div className="col">
                <span className="kicker" style={{ color: 'var(--yellow)' }}>Prize pool</span>
                <b className="display" style={{ fontSize: 26, color: 'var(--yellow)', textShadow: '0 0 26px rgba(232,255,58,.5)' }}>
                  {inr(event.prizePool)}
                </b>
              </div>
              <div className="col" style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <span className="kicker">Entry</span>
                <b className="display" style={{ fontSize: 18 }}>{event.entryFee ? inr(event.entryFee) : 'FREE'}</b>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="slot-line">
                <span>
                  {event.slotsFilled} of {event.slotsTotal} squads locked
                </span>
                <span className={left <= 5 ? 'red' : 'yellow'}>{left === 0 ? 'WAITLIST ONLY' : `${left} SLOTS LEFT`}</span>
              </div>
              <Progress value={event.slotsFilled} max={event.slotsTotal} />
            </div>

            <div className="row gap-10" style={{ marginTop: 13 }}>
              <Countdown target={event.startsAt} gold size="sm" />
              <Btn variant={registered ? 'ghost' : 'yellow'} cut icon={registered ? 'checkCircle' : 'bolt'} onClick={(e) => { e.stopPropagation(); onJoin(event) }}>
                {registered ? 'Registered' : left === 0 ? 'Join Waitlist' : 'Register'}
              </Btn>
            </div>
          </div>
        </div>
      </Art>
    </div>
  )
}
