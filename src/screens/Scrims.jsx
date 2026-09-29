/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Scrims hub
   Browse · filter (time / entry fee / prize pool / map) · book a slot ·
   join instantly · upcoming + completed
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon, MapGlyph } from '../icons'
import { Badge, Btn, EmptyState, Progress, SearchBar, SectionHead, StatTile, Tabs } from '../ui'
import { FilterSheet, SortBar } from '../components/Filters'
import { LiveMatchCard, ScrimCard } from '../components/EventCards'
import { useWG } from '../store'
import { MAPS, MODES } from '../data'
import { DAY, HOUR, cx, inrShort, sum } from '../utils'

const DEFAULTS = { time: 'any', fee: 'any', prize: 'any', maps: [], modes: [], tier: [] }

export default function Scrims() {
  const { scrims, navigate, openSheet, closeSheet, sheet, clock, bookings } = useWG()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState('upcoming')
  const [filters, setFilters] = useState(DEFAULTS)
  const [sort, setSort] = useState('time')

  const filterOpen = sheet?.type === 'scrimFilters'

  /* ── filter + sort pipeline ───────────────────────────────────────────── */
  const list = useMemo(() => {
    const nowT = clock
    let out = scrims.filter((s) => {
      if (q && !`${s.name} ${s.map} ${s.mode} ${s.organizer.name} ${s.tier}`.toLowerCase().includes(q.toLowerCase())) return false
      if (tab === 'live' && s.status !== 'live') return false
      if (tab === 'completed' && s.status !== 'completed') return false
      if (tab === 'upcoming' && s.status === 'completed') return false
      if (tab === 'upcoming' && new Date(s.startsAt).getTime() < nowT - 30 * 60000) return false

      const t = new Date(s.startsAt).getTime() - nowT
      if (filters.time === 'today' && t > DAY) return false
      if (filters.time === 'tonight' && (t > 12 * HOUR || t < 0)) return false
      if (filters.time === 'tomorrow' && (t < DAY || t > 2 * DAY)) return false
      if (filters.time === '3h' && t > 3 * HOUR) return false

      if (filters.fee === 'free' && s.entryFee > 0) return false
      if (filters.fee === 'u25' && s.entryFee > 25) return false
      if (filters.fee === 'u50' && s.entryFee > 50) return false
      if (filters.fee === 'paid' && s.entryFee === 0) return false

      if (filters.prize === '5k' && s.prizePool < 5000) return false
      if (filters.prize === '10k' && s.prizePool < 10000) return false
      if (filters.prize === '20k' && s.prizePool < 20000) return false

      if (filters.maps.length && !filters.maps.includes(s.map)) return false
      if (filters.modes.length && !filters.modes.includes(s.mode)) return false
      if (filters.tier.length && !filters.tier.includes(s.tier)) return false
      return true
    })

    const by = {
      time: (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
      fee: (a, b) => a.entryFee - b.entryFee,
      prize: (a, b) => b.prizePool - a.prizePool,
      slots: (a, b) => b.slotsTotal - b.slotsFilled - (a.slotsTotal - a.slotsFilled),
      perKill: (a, b) => (b.perKill || 0) - (a.perKill || 0),
    }
    return out.sort(by[sort] || by.time)
  }, [scrims, q, tab, filters, sort, clock])

  const tonight = scrims.filter((s) => {
    const t = new Date(s.startsAt).getTime() - clock
    return t > 0 && t < 12 * HOUR && s.status !== 'completed'
  })
  const openSlots = sum(tonight, (s) => Math.max(0, s.slotsTotal - s.slotsFilled))
  const poolTonight = sum(tonight, (s) => s.prizePool)
  const myScrimBookings = bookings.filter((b) => b.eventType === 'scrim')

  const openEvent = (e) => navigate('event', { id: e.id })
  const joinEvent = (e) => navigate('booking', { id: e.id })

  const sections = [
    {
      key: 'time',
      label: 'Time window',
      icon: 'clock',
      type: 'single',
      options: [
        { id: 'any', label: 'Any time' },
        { id: '3h', label: 'Next 3 hours' },
        { id: 'tonight', label: 'Tonight (12h)' },
        { id: 'today', label: 'Today' },
        { id: 'tomorrow', label: 'Tomorrow' },
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
        { id: 'u25', label: 'Under ₹25' },
        { id: 'u50', label: 'Under ₹50' },
        { id: 'paid', label: 'Paid only' },
      ],
    },
    {
      key: 'prize',
      label: 'Prize pool',
      icon: 'trophy',
      type: 'single',
      options: [
        { id: 'any', label: 'Any' },
        { id: '5k', label: '₹5K +' },
        { id: '10k', label: '₹10K +' },
        { id: '20k', label: '₹20K +' },
      ],
    },
    {
      key: 'maps',
      label: 'Map',
      icon: 'map',
      type: 'multi',
      options: MAPS.map((m) => ({ id: m, label: m })),
    },
    { key: 'modes', label: 'Mode', icon: 'users', type: 'multi', options: MODES.map((m) => ({ id: m, label: m })) },
    {
      key: 'tier',
      label: 'Lobby tier',
      icon: 'shield',
      type: 'multi',
      options: ['Rookie', 'Open', 'Pro', 'Elite'].map((t) => ({ id: t, label: t })),
    },
  ]

  const activeFilters =
    (filters.time !== 'any' ? 1 : 0) +
    (filters.fee !== 'any' ? 1 : 0) +
    (filters.prize !== 'any' ? 1 : 0) +
    filters.maps.length +
    filters.modes.length +
    filters.tier.length

  return (
    <>
      <header className="app-header">
        <div className="row gap-10">
          <div className="grow">
            <div className="kicker blue">Scrim hub</div>
            <div className="display" style={{ fontSize: 22, marginTop: 3 }}>
              BOOK A <span className="grad-text-yellow">LOBBY</span>
            </div>
          </div>
          <button
            className="icon-btn"
            onClick={() => openSheet({ type: 'scrimFilters' })}
            aria-label="filters"
            style={activeFilters ? { borderColor: 'rgba(232,255,58,.5)', color: 'var(--yellow)' } : null}
          >
            <Icon name="sliders" />
            {activeFilters > 0 && <span className="pip" style={{ background: 'var(--yellow)', boxShadow: '0 0 10px var(--yellow)' }} />}
          </button>
          <button className="icon-btn" onClick={() => navigate('teams')} aria-label="my teams">
            <Icon name="users" />
          </button>
        </div>
        <div style={{ marginTop: 12 }}>
          <SearchBar value={q} onChange={setQ} placeholder="Search scrims, maps or hosts…" />
        </div>
      </header>

      <div className="page">
        {/* ── live lobby ───────────────────────────────────────────────── */}
        {tab === 'live' && (
          <section style={{ marginBottom: 14 }}>
            <LiveMatchCard onOpen={openEvent} />
          </section>
        )}

        {/* ── tonight snapshot ─────────────────────────────────────────── */}
        {!q && tab === 'upcoming' && (
          <section style={{ marginBottom: 14 }}>
            <div className="stat-grid three">
              <StatTile label="Tonight" value={tonight.length} sub="lobbies" icon="crosshair" />
              <StatTile label="Open slots" value={openSlots} sub="squads can enter" tone="green" icon="users" />
              <StatTile label="Prize pool" value={inrShort(poolTonight)} sub="up for grabs" tone="gold" icon="trophy" />
            </div>
          </section>
        )}

        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { id: 'upcoming', label: `Upcoming · ${scrims.filter((s) => s.status !== 'completed' && s.status !== 'live').length}` },
            { id: 'live', label: 'Live' },
            { id: 'completed', label: 'Completed' },
          ]}
        />

        <div style={{ marginBottom: 14 }}>
          <SortBar
            value={sort}
            onChange={setSort}
            options={[
              { id: 'time', label: 'Start time' },
              { id: 'fee', label: 'Entry fee' },
              { id: 'prize', label: 'Prize pool' },
              { id: 'slots', label: 'Slots left' },
              { id: 'perKill', label: 'Per kill' },
            ]}
          />
        </div>

        {activeFilters > 0 && (
          <div className="row gap-8" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <Badge tone="yellow" icon="filter">
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} on
            </Badge>
            <button className="link" style={{ fontFamily: 'var(--font-head)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--blue-hi)' }} onClick={() => setFilters(DEFAULTS)}>
              Clear all
            </button>
          </div>
        )}

        {/* ── results ──────────────────────────────────────────────────── */}
        {list.length === 0 ? (
          <EmptyState
            icon="crosshair"
            title={tab === 'completed' ? 'No completed scrims yet' : 'No lobbies match'}
            body="Widen your time window or clear a filter — new scrims drop every 30 minutes on WarGrid."
            action="Reset filters"
            onAction={() => { setFilters(DEFAULTS); setQ('') }}
          />
        ) : (
          <div className="stagger col gap-10">
            {list.map((s) => (
              <ScrimCard key={s.id} event={s} onOpen={openEvent} onJoin={joinEvent} />
            ))}
          </div>
        )}

        {/* ── my scrim history ─────────────────────────────────────────── */}
        {myScrimBookings.length > 0 && tab !== 'live' && (
          <section className="section">
            <SectionHead title="Your scrim bookings" rule action="My Matches" onAction={() => navigate('matches')} />
            <div className="card pad">
              {myScrimBookings.slice(0, 4).map((b) => {
                const e = scrims.find((x) => x.id === b.eventId)
                if (!e) return null
                return (
                  <div className="member-row" key={b.id} onClick={() => navigate('match', { id: b.id })} style={{ cursor: 'pointer' }}>
                    <span className="li" style={{ width: 34, height: 34, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'rgba(232,255,58,.1)', border: '1px solid rgba(232,255,58,.26)', color: 'var(--yellow)' }}>
                      <Icon name="ticket" size={15} />
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="truncate" style={{ fontSize: 12.5 }}>{e.name}</b>
                      <span className="truncate" style={{ fontSize: 10.5 }}>
                        {b.status === 'completed' && b.result ? `#${b.result.position} · ${b.result.kills} kills · +₹${b.result.earned}` : b.status === 'waitlist' ? 'On waitlist' : 'Confirmed'}
                      </span>
                    </div>
                    <Icon name="chevronRight" size={15} className="faint" />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <div style={{ height: 8 }} />
      </div>

      {filterOpen && (
        <FilterSheet
          title="Filter scrims"
          value={filters}
          onChange={setFilters}
          sections={sections}
          onClose={closeSheet}
          onReset={() => setFilters(DEFAULTS)}
          applyLabel={`Show ${list.length} lobb${list.length === 1 ? 'y' : 'ies'}`}
        />
      )}
    </>
  )
}
