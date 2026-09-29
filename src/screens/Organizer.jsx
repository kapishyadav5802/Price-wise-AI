/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Organiser dashboard
   Create scrims/tournaments · fees · prize pool · slots · banner · schedule ·
   manage teams · release room ID/password · publish results · earnings
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon } from '../icons'
import { Art, ArtPicker, Avatar, Badge, Btn, CdInline, Chip, Countdown, EmptyState, Field, Input, Progress, ScreenHeader, SectionHead, Select, Sheet, StatTile, Textarea, Toggle } from '../ui'
import { useWG } from '../store'
import { MAPS, MODES, ORGANIZER_ME, ORG_RESULTS_TEMPLATE } from '../data'
import { cx, fmtDate, fmtDateShort, fmtTime, inr, inrShort, pct, relTime, sum } from '../utils'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'create', label: 'Create' },
  { id: 'events', label: 'My events' },
  { id: 'participants', label: 'Participants' },
  { id: 'results', label: 'Rooms & results' },
  { id: 'earnings', label: 'Earnings' },
]

const todayISO = () => {
  const d = new Date()
  d.setHours(20, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function Organizer() {
  const {
    orgEvents,
    orgParticipants,
    orgEarnings,
    back,
    navigate,
    createOrgEvent,
    releaseRoom,
    updateResults,
    toggleParticipant,
    toast,
    sheet,
    openSheet,
    closeSheet,
    getEvent,
    clock,
    notify,
    bookings,
  } = useWG()

  const [tab, setTab] = useState('overview')
  const [q, setQ] = useState('')

  /* ── create form ──────────────────────────────────────────────────────── */
  const emptyForm = {
    type: 'scrim',
    name: '',
    mode: 'Squad',
    map: 'Erangel',
    maps: ['Erangel', 'Miramar'],
    date: todayISO(),
    time: '20:00',
    entryFee: '0',
    prizePool: '5000',
    perKill: '100',
    slots: '25',
    matches: '1',
    tier: 'Open',
    description: '',
    rules: '',
    art: 'art-3',
  }
  const [form, setForm] = useState(emptyForm)
  const [formErr, setFormErr] = useState('')

  /* ── rooms & results ──────────────────────────────────────────────────── */
  const [roomEvent, setRoomEvent] = useState(orgEvents[1]?.id || '')
  const [roomId, setRoomId] = useState('')
  const [roomPass, setRoomPass] = useState('')
  const [resEvent, setResEvent] = useState(orgEvents[0]?.id || '')
  const [rows, setRows] = useState(ORG_RESULTS_TEMPLATE)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const stats = useMemo(() => {
    const revenue = sum(orgEvents, (e) => e.revenue)
    const registrations = orgParticipants.length
    const fillRate = Math.round(sum(orgEvents.map((e) => { const [a, b] = e.slots.split(' / ').map(Number); return b ? (a / b) * 100 : 0 }), (x) => x) / orgEvents.length)
    return { revenue, registrations, fillRate }
  }, [orgEvents, orgParticipants])

  const publish = () => {
    if (!form.name.trim()) return setFormErr('Give your battle a name.')
    if (Number(form.slots) < 2) return setFormErr('Slots must be at least 2.')
    if (Number(form.prizePool) < 0 || Number.isNaN(Number(form.prizePool))) return setFormErr('Prize pool must be a number.')
    const startsAt = new Date(`${form.date}T${form.time}:00`).toISOString()
    if (new Date(startsAt).getTime() < Date.now()) return setFormErr('Start time is in the past.')
    setFormErr('')
    const ev = createOrgEvent({
      ...form,
      startsAt,
      entryFee: Number(form.entryFee),
      prizePool: Number(form.prizePool),
      perKill: Number(form.perKill),
      slots: Number(form.slots),
      matches: Number(form.matches),
      rules: form.rules.split('\n').map((r) => r.trim()).filter(Boolean),
      releaseAt: new Date(new Date(startsAt).getTime() - 20 * 60000).toISOString(),
    })
    setForm({ ...emptyForm, type: form.type })
    setTab('events')
    navigate('event', { id: ev.id })
  }

  return (
    <>
      <ScreenHeader
        title="Organiser dashboard"
        subtitle={`${ORGANIZER_ME.name} · ★ ${ORGANIZER_ME.rating} · ${ORGANIZER_ME.events} events`}
        onBack={back}
        right={
          <button className="icon-btn" onClick={() => openSheet({ type: 'orgMenu' })} aria-label="more">
            <Icon name="dots" />
          </button>
        }
      />

      <div className="page">
        <div className="chip-scroll edge" style={{ marginBottom: 14 }}>
          {TABS.map((t) => (
            <Chip key={t.id} active={tab === t.id} yellow={tab === t.id} onClick={() => setTab(t.id)}>
              {t.id === 'create' && <Icon name="plus" size={12} />}
              {t.label}
            </Chip>
          ))}
        </div>

        {/* ══ OVERVIEW ═══════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="step-body">
            <div className="hub-card" style={{ marginBottom: 14 }}>
              <div className="row gap-12">
                <Avatar name={ORGANIZER_ME.name} tone="blue" size="lg" ring />
                <div className="grow">
                  <b className="h-head row gap-6" style={{ fontSize: 15 }}>
                    {ORGANIZER_ME.name} <Icon name="verified" size={14} className="blue" />
                  </b>
                  <div className="tiny muted" style={{ marginTop: 4, lineHeight: 1.5 }}>{ORGANIZER_ME.bio}</div>
                  <div className="row gap-6" style={{ marginTop: 8 }}>
                    <Badge tone="green">{ORGANIZER_ME.followers.toLocaleString('en-IN')} followers</Badge>
                    <Badge tone="blue">{ORGANIZER_ME.payout}</Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="stat-grid">
              <StatTile label="Revenue (all time)" value={orgEarnings.total} prefix="₹" sub={`${inrShort(orgEarnings.month)} this month`} tone="gold" icon="rupee" spark={orgEarnings.spark} />
              <StatTile label="Active events" value={orgEvents.length} sub={`${orgEvents.filter((e) => e.status.includes('LIVE')).length} live right now`} icon="trophy" />
              <StatTile label="Registrations" value={orgParticipants.length * 14} sub={`${stats.fillRate}% avg fill rate`} tone="green" icon="users" />
              <StatTile label="Pending payout" value={orgEarnings.pending} prefix="₹" sub="settles every Monday" icon="bank" />
            </div>

            <section className="section">
              <SectionHead title="Quick actions" rule />
              <div className="quick-grid">
                {[
                  { i: 'crosshair', l: 'New scrim', t: 'gold', fn: () => { setTab('create'); set('type', 'scrim') } },
                  { i: 'trophy', l: 'Tournament', t: '', fn: () => { setTab('create'); set('type', 'tournament') } },
                  { i: 'key', l: 'Room ID', t: 'green', fn: () => setTab('results') },
                  { i: 'chart', l: 'Results', t: 'violet', fn: () => setTab('results') },
                ].map((a) => (
                  <button className="quick" key={a.l} onClick={a.fn}>
                    <span className={cx('qi', a.t === 'gold' && 'gold', a.t === 'green' && 'green', a.t === 'violet' && 'violet')}>
                      <Icon name={a.i} />
                    </span>
                    <span>{a.l}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="section">
              <SectionHead title="Live & upcoming" rule action="All events" onAction={() => setTab('events')} />
              <div className="col gap-10">
                {orgEvents.slice(0, 4).map((e) => (
                  <OrgEventRow key={e.id} e={e} onOpen={() => navigate('event', { id: e.id })} onManage={() => setTab('results')} />
                ))}
              </div>
            </section>

            <section className="section">
              <SectionHead title="Needs your attention" rule />
              <div className="card pad">
                {[
                  { i: 'alert', t: '2 rosters incomplete', s: 'Iron Wolves & Neon Vipers · Conquer Cup S4', tone: 'red' },
                  { i: 'clock', t: '1 payment pending', s: 'Clutch Kings · ₹199 · retry in 2 hours', tone: 'yellow' },
                  { i: 'shieldCheck', t: '1 event awaiting admin approval', s: 'Campus Clash Collegiate', tone: 'blue' },
                ].map((x) => (
                  <div className="rule-item" key={x.t}>
                    <span className="n"><Icon name={x.i} size={12} /></span>
                    <span>
                      <b className="h-head" style={{ fontSize: 12.3, display: 'block' }}>{x.t}</b>
                      <span className="tiny muted">{x.s}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ══ CREATE ═════════════════════════════════════════════════════ */}
        {tab === 'create' && (
          <div className="step-body">
            <div className="segmented" style={{ marginBottom: 14 }}>
              {[
                { id: 'scrim', label: 'Scrim lobby' },
                { id: 'tournament', label: 'Tournament' },
              ].map((o) => (
                <button key={o.id} className={cx(form.type === o.id && 'active')} onClick={() => set('type', o.id)}>
                  {o.label}
                </button>
              ))}
            </div>

            {/* banner preview */}
            <Art variant={form.art} style={{ height: 112, borderRadius: 18 }}>
              <div style={{ position: 'relative', zIndex: 6, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 12 }}>
                <div className="row gap-6">
                  <Badge tone="blue">{form.mode}</Badge>
                  <Badge tone={Number(form.entryFee) ? 'yellow' : 'green'}>{Number(form.entryFee) ? inr(Number(form.entryFee)) : 'Free'}</Badge>
                </div>
                <div className="h-head" style={{ fontSize: 15, marginTop: 6, textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>
                  {form.name || (form.type === 'scrim' ? 'Your scrim name' : 'Your tournament name')}
                </div>
              </div>
            </Art>
            <div className="upload-box" style={{ marginTop: 10, height: 84 }} onClick={() => toast('Banner picker', 'Choose a WarGrid banner theme below', 'info')}>
              <div>
                <Icon name="image" />
                <b>Upload tournament banner</b>
                <span>1080 × 620 · PNG/JPG · or pick a WarGrid theme</span>
              </div>
            </div>
            <Field label="Banner theme">
              <ArtPicker value={form.art} onChange={(art) => set('art', art)} />
            </Field>

            <Field label="Battle name" error={formErr.includes('name') ? formErr : ''}>
              <Input value={form.name} placeholder={form.type === 'scrim' ? 'Erangel Prime Scrim #219' : 'Conquer Cup — Season 5'} onChange={(e) => set('name', e.target.value)} />
            </Field>

            <div className="field-row">
              <Field label="Format">
                <Select value={form.mode} onChange={(e) => set('mode', e.target.value)}>
                  {MODES.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </Field>
              <Field label={form.type === 'scrim' ? 'Map' : 'Primary map'}>
                <Select value={form.map} onChange={(e) => set('map', e.target.value)}>
                  {MAPS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="field-row">
              <Field label="Date">
                <Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
              </Field>
              <Field label="Start time (IST)">
                <Input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
              </Field>
            </div>

            <div className="field-row-3">
              <Field label="Entry fee ₹">
                <Input value={form.entryFee} inputMode="numeric" onChange={(e) => set('entryFee', e.target.value.replace(/\D/g, ''))} />
              </Field>
              <Field label="Prize pool ₹">
                <Input value={form.prizePool} inputMode="numeric" onChange={(e) => set('prizePool', e.target.value.replace(/\D/g, ''))} />
              </Field>
              <Field label="Per kill ₹">
                <Input value={form.perKill} inputMode="numeric" onChange={(e) => set('perKill', e.target.value.replace(/\D/g, ''))} />
              </Field>
            </div>

            <div className="field-row-3">
              <Field label="Slots" error={formErr.includes('Slots') ? formErr : ''}>
                <Input value={form.slots} inputMode="numeric" onChange={(e) => set('slots', e.target.value.replace(/\D/g, ''))} />
              </Field>
              <Field label="Matches">
                <Input value={form.matches} inputMode="numeric" onChange={(e) => set('matches', e.target.value.replace(/\D/g, ''))} />
              </Field>
              <Field label="Lobby tier">
                <Select value={form.tier} onChange={(e) => set('tier', e.target.value)}>
                  {['Rookie', 'Open', 'Pro', 'Elite'].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
            </div>

            {form.type === 'tournament' && (
              <Field label="Maps in rotation" hint="Comma separated — used for the match schedule.">
                <Input value={form.maps.join(', ')} onChange={(e) => set('maps', e.target.value.split(',').map((m) => m.trim()).filter(Boolean))} />
              </Field>
            )}

            <Field label="Description" hint="Shown at the top of your event page.">
              <Textarea value={form.description} placeholder="What makes this battle worth entering? Format, payouts, scouting…" onChange={(e) => set('description', e.target.value)} />
            </Field>

            <Field label="Rules" hint="One rule per line.">
              <Textarea
                value={form.rules}
                placeholder={'Room ID released 20 minutes before start\nNo emulators or third-party apps\nPrize credited within 24 hours'}
                onChange={(e) => set('rules', e.target.value)}
              />
            </Field>

            {/* schedule builder */}
            <section className="section" style={{ marginTop: 6 }}>
              <SectionHead title="Match schedule" rule />
              <div className="card pad">
                {Array.from({ length: Math.min(4, Number(form.matches) || 1) }).map((_, i) => {
                  const base = new Date(`${form.date}T${form.time}:00`)
                  base.setMinutes(base.getMinutes() + i * 55)
                  const map = form.type === 'scrim' ? form.map : form.maps[i % Math.max(1, form.maps.length)] || form.map
                  return (
                    <div className="tl-item" key={i}>
                      <b>Match {i + 1}</b>
                      <span>
                        {fmtTime(base.toISOString())} · {map}
                      </span>
                    </div>
                  )
                })}
                <div className="tiny faint" style={{ marginTop: 6 }}>
                  Schedule auto-generates from your start time ({Number(form.matches) || 1} matches, 55 min apart). Fine-tune after publishing.
                </div>
              </div>
            </section>

            <div className="receipt" style={{ marginTop: 14 }}>
              <div className="receipt-line"><span>Gross entry revenue</span><b>{inr(Number(form.entryFee) * Number(form.slots))}</b></div>
              <div className="receipt-line"><span>WarGrid platform fee (5%)</span><b className="red">− {inr(Math.round(Number(form.entryFee) * Number(form.slots) * 0.05))}</b></div>
              <div className="receipt-line"><span>Prize pool you fund</span><b className="red">− {inr(Number(form.prizePool))}</b></div>
              <div className="receipt-line total">
                <span>Net if sold out</span>
                <b>{inr(Math.round(Number(form.entryFee) * Number(form.slots) * 0.95 - Number(form.prizePool)))}</b>
              </div>
            </div>

            {formErr && !formErr.includes('name') && !formErr.includes('Slots') && <div className="hint err" style={{ marginTop: 10 }}>{formErr}</div>}

            <div className="row gap-8" style={{ marginTop: 14 }}>
              <Btn variant="ghost" className="grow" icon="eye" onClick={() => toast('Preview', 'Event page renders exactly as players see it', 'info')}>
                Preview
              </Btn>
              <Btn variant="primary" className="grow" cut icon="bolt" onClick={publish}>
                {form.type === 'scrim' ? 'Publish scrim' : 'Submit for approval'}
              </Btn>
            </div>
          </div>
        )}

        {/* ══ MY EVENTS ══════════════════════════════════════════════════ */}
        {tab === 'events' && (
          <div className="step-body">
            <div className="searchbar" style={{ marginBottom: 13 }}>
              <Icon name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your events…" />
            </div>
            <div className="col gap-10 stagger">
              {orgEvents
                .filter((e) => !q || e.name.toLowerCase().includes(q.toLowerCase()))
                .map((e) => (
                  <OrgEventRow key={e.id} e={e} onOpen={() => navigate('event', { id: e.id })} onManage={() => { setRoomEvent(e.id); setTab('results') }} />
                ))}
            </div>
            <Btn variant="outline" block icon="plus" style={{ marginTop: 14 }} onClick={() => setTab('create')}>
              Create new battle
            </Btn>
          </div>
        )}

        {/* ══ PARTICIPANTS ═══════════════════════════════════════════════ */}
        {tab === 'participants' && (
          <div className="step-body">
            <div className="stat-grid three" style={{ marginBottom: 13 }}>
              <StatTile label="Registered" value={orgParticipants.length * 14} sub="squads across events" icon="users" />
              <StatTile label="Checked in" value={orgParticipants.filter((p) => p.checked).length * 14} sub="device verified" tone="green" icon="shieldCheck" />
              <StatTile label="Flagged" value={orgParticipants.filter((p) => !p.paid || p.status.includes('Flag')).length} sub="needs action" tone="red" icon="alert" />
            </div>

            <div className="searchbar" style={{ marginBottom: 13 }}>
              <Icon name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team or captain…" />
            </div>

            <div className="col gap-8 stagger">
              {orgParticipants
                .filter((p) => !q || `${p.team} ${p.captain} ${p.tag}`.toLowerCase().includes(q.toLowerCase()))
                .map((p) => (
                  <div className={cx('card pad', p.checked && 'blue-edge')} key={p.id} style={{ padding: 12 }}>
                    <div className="row gap-10">
                      <Avatar name={p.team} tone={p.checked ? 'green' : p.paid ? 'blue' : 'red'} size="md" />
                      <div className="grow" style={{ minWidth: 0 }}>
                        <b className="h-head truncate row gap-6" style={{ fontSize: 13 }}>
                          <span className="truncate">{p.team}</span>
                          <span className="team-tag" style={{ fontSize: 8.5 }}>{p.tag}</span>
                        </b>
                        <span className="tiny faint truncate">Captain {p.captain} · {p.players}/4 players · Seat #{p.seat}</span>
                        <div className="row gap-6" style={{ marginTop: 6 }}>
                          <Badge tone={p.paid ? 'green' : 'red'} icon={p.paid ? 'check' : 'alert'}>{p.paid ? 'Paid ₹199' : 'Payment pending'}</Badge>
                          <Badge tone={p.status === 'Verified' ? 'blue' : 'yellow'}>{p.status}</Badge>
                        </div>
                      </div>
                      <Toggle on={p.checked} onChange={() => toggleParticipant(p.id)} label="check in" />
                    </div>
                    <div className="row gap-8" style={{ marginTop: 10 }}>
                      <Btn size="xs" variant="ghost" className="grow" icon="users" onClick={() => toast('Roster', `${p.team}: 4 BGMI IDs verified`, 'info')}>
                        Roster
                      </Btn>
                      <Btn size="xs" variant="ghost" className="grow" icon="send" onClick={() => toast('Reminder sent', `${p.captain} notified on app + SMS`, 'info')}>
                        Remind
                      </Btn>
                      {!p.paid && (
                        <Btn size="xs" variant="danger" icon="close" onClick={() => toast('Slot released', `${p.team} removed · seat #${p.seat} open`, 'warn')}>
                          Drop
                        </Btn>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="row gap-8" style={{ marginTop: 14 }}>
              <Btn variant="ghost" size="sm" className="grow" icon="download" onClick={() => toast('Export started', 'CSV of 112 squads emailed to you', 'info')}>
                Export CSV
              </Btn>
              <Btn variant="outline" size="sm" className="grow" icon="send" onClick={() => toast('Broadcast sent', 'All captains notified about the lobby', 'success')}>
                Broadcast
              </Btn>
            </div>
          </div>
        )}

        {/* ══ ROOMS & RESULTS ════════════════════════════════════════════ */}
        {tab === 'results' && (
          <div className="step-body">
            <SectionHead title="Release room ID" rule />
            <div className="card pad">
              <Field label="Select event">
                <Select value={roomEvent} onChange={(e) => setRoomEvent(e.target.value)}>
                  {orgEvents.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {e.type}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="field-row">
                <Field label="Room ID">
                  <Input value={roomId} inputMode="numeric" placeholder="88421576" onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                </Field>
                <Field label="Password">
                  <Input value={roomPass} placeholder="WG@219" onChange={(e) => setRoomPass(e.target.value.slice(0, 12))} />
                </Field>
              </div>
              <div className="row gap-8">
                <Btn
                  variant="ghost"
                  size="sm"
                  className="grow"
                  icon="refresh"
                  onClick={() => {
                    setRoomId(String(Math.floor(10000000 + Math.random() * 89999999)))
                    setRoomPass(`WG@${Math.floor(100 + Math.random() * 899)}`)
                  }}
                >
                  Auto-generate
                </Btn>
                <Btn
                  variant="yellow"
                  size="sm"
                  className="grow"
                  icon="key"
                  disabled={!roomId || !roomPass}
                  onClick={() => {
                    releaseRoom(roomEvent, roomId, roomPass)
                    setRoomId('')
                    setRoomPass('')
                  }}
                >
                  Release now
                </Btn>
              </div>
              <div className="tiny faint" style={{ marginTop: 10, lineHeight: 1.5 }}>
                Releasing pushes a notification to every registered captain and reveals credentials in My Matches instantly.
              </div>
            </div>

            <section className="section">
              <SectionHead title="Publish results" rule />
              <div className="card pad">
                <Field label="Event">
                  <Select value={resEvent} onChange={(e) => setResEvent(e.target.value)}>
                    {orgEvents.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <div className="dtable" style={{ marginBottom: 12 }}>
                  <div className="tr head">
                    <span style={{ width: 30 }}>#</span>
                    <span className="c1">Team</span>
                    <span className="c2" style={{ textAlign: 'center' }}>Kills</span>
                    <span className="c3">Points</span>
                  </div>
                  {rows.map((r, i) => (
                    <div className="tr" key={r.tag}>
                      <span style={{ width: 30, fontFamily: 'var(--font-display)', fontWeight: 800, color: i === 0 ? 'var(--yellow)' : 'var(--faint)' }}>{r.pos}</span>
                      <span className="c1 truncate">{r.team}</span>
                      <span className="c2" style={{ textAlign: 'center' }}>
                        <input
                          className="input"
                          style={{ padding: '6px 8px', width: 52, textAlign: 'center', fontSize: 12 }}
                          value={r.kills}
                          inputMode="numeric"
                          onChange={(e) => setRows((rs) => rs.map((x, xi) => (xi === i ? { ...x, kills: Number(e.target.value.replace(/\D/g, '')) || 0 } : x)))}
                        />
                      </span>
                      <span className="c3">
                        <input
                          className="input"
                          style={{ padding: '6px 8px', width: 56, textAlign: 'right', fontSize: 12 }}
                          value={r.points}
                          inputMode="numeric"
                          onChange={(e) => setRows((rs) => rs.map((x, xi) => (xi === i ? { ...x, points: Number(e.target.value.replace(/\D/g, '')) || 0 } : x)))}
                        />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="row gap-8">
                  <Btn variant="ghost" size="sm" className="grow" icon="refresh" onClick={() => setRows(ORG_RESULTS_TEMPLATE)}>
                    Reset
                  </Btn>
                  <Btn
                    variant="success"
                    size="sm"
                    className="grow"
                    icon="chart"
                    onClick={() => {
                      const sorted = [...rows].sort((a, b) => b.points - a.points).map((r, i) => ({ ...r, pos: i + 1 }))
                      setRows(sorted)
                      updateResults(resEvent, sorted)
                    }}
                  >
                    Publish &amp; pay prizes
                  </Btn>
                </div>
                <div className="tiny faint" style={{ marginTop: 10, lineHeight: 1.5 }}>
                  Publishing writes results to every participant's My Matches, credits prize money to wallets and updates the leaderboard.
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ══ EARNINGS ═══════════════════════════════════════════════════ */}
        {tab === 'earnings' && (
          <div className="step-body">
            <div className="wallet-card" style={{ marginBottom: 14 }}>
              <div className="row-between">
                <span className="kicker" style={{ color: 'rgba(255,255,255,.66)' }}>Lifetime organiser revenue</span>
                <Badge tone="green" icon="verified">Payouts on</Badge>
              </div>
              <div className="balance" style={{ marginTop: 9 }}>
                <sup>₹</sup>
                {orgEarnings.total.toLocaleString('en-IN')}
              </div>
              <div className="tiny" style={{ color: 'rgba(255,255,255,.6)', marginTop: 7 }}>
                {inr(orgEarnings.month)} this month · {inr(orgEarnings.pending)} settling · 5% platform fee
              </div>
              <div className="wallet-actions">
                <WalletAction icon="bank" label="Payout" onClick={() => toast('Payout requested', `${inr(orgEarnings.pending)} → HDFC ••••8890`, 'success')} />
                <WalletAction icon="download" label="GST report" onClick={() => toast('Report ready', 'GST-3B export downloaded', 'info')} />
                <WalletAction icon="chart" label="Analytics" onClick={() => toast('Analytics', 'Conversion 68% · repeat rate 41%', 'info')} />
                <WalletAction icon="rupee" label="Fee plan" onClick={() => openSheet({ type: 'feePlan' })} />
              </div>
            </div>

            <SectionHead title="Event revenue" rule />
            <div className="card pad">
              {orgEarnings.rows.map((r) => (
                <div className="txn" key={r.id}>
                  <span className={cx('ti', r.gross ? 'credit' : 'debit')}>
                    <Icon name={r.gross ? 'trophy' : 'gift'} />
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate">{r.event}</b>
                    <span className="truncate">
                      Gross {inr(r.gross)} · fee {inr(r.fee)} · {fmtDateShort(r.at)}
                    </span>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end' }}>
                    <span className="amt credit">{inr(r.net)}</span>
                    <Badge tone={r.status === 'Paid' ? 'green' : r.status === 'In escrow' ? 'blue' : 'yellow'}>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>

            <section className="section">
              <SectionHead title="Escrow & settlement" rule />
              <div className="card pad">
                {[
                  { i: 'lock', t: 'Entry fees held in escrow', s: 'Released to you 2 hours after the lobby starts.' },
                  { i: 'refresh', t: 'Auto refunds', s: 'Cancelled events refund players automatically — no dispute risk.' },
                  { i: 'bank', t: 'Weekly payouts', s: 'Every Monday to your verified bank account, TDS applied above ₹10,000.' },
                  { i: 'scale', t: 'Prize guarantee', s: 'Prize pools above ₹1L require escrow pre-funding before approval.' },
                ].map((f) => (
                  <div className="rule-item" key={f.t}>
                    <span className="n"><Icon name={f.i} size={12} /></span>
                    <span>
                      <b className="h-head" style={{ fontSize: 12.3, display: 'block' }}>{f.t}</b>
                      <span className="tiny muted">{f.s}</span>
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
        <div style={{ height: 10 }} />
      </div>

      {/* ── sheets ───────────────────────────────────────────────────────── */}
      {sheet?.type === 'orgMenu' && (
        <Sheet title="Organiser tools" icon="headset" onClose={closeSheet}>
          {[
            { i: 'trophy', l: 'Event templates', s: 'Reuse a past lobby in one tap', fn: () => toast('Templates', '12 saved templates available', 'info') },
            { i: 'users', l: 'Moderation crew', s: '4 spectators assigned', fn: () => toast('Crew', 'Spectators auto-join 15 min before start', 'info') },
            { i: 'shieldCheck', l: 'Anti-cheat review', s: 'Top 10 teams reviewed per event', fn: () => toast('Anti-cheat', '0 flags in your last 12 events', 'success') },
            { i: 'bell', l: 'Broadcast to followers', s: `${ORGANIZER_ME.followers.toLocaleString('en-IN')} followers`, fn: () => toast('Broadcast sent', 'Followers notified about your next lobby', 'success') },
            { i: 'settings', l: 'Payout settings', s: 'HDFC ••••8890 · weekly', fn: () => setTab('earnings') },
          ].map((r) => (
            <button className="list-row tap" key={r.l} onClick={() => { r.fn(); closeSheet() }}>
              <span className="li"><Icon name={r.i} /></span>
              <span className="grow" style={{ textAlign: 'left' }}>
                <b className="truncate">{r.l}</b>
                <span className="truncate">{r.s}</span>
              </span>
              <Icon name="chevronRight" className="faint chev" />
            </button>
          ))}
        </Sheet>
      )}

      {sheet?.type === 'feePlan' && (
        <Sheet title="Platform fee plan" subtitle="What WarGrid charges you" icon="rupee" onClose={closeSheet} footer={<Btn variant="primary" icon="check" onClick={closeSheet}>Got it</Btn>}>
          {[
            { plan: 'Free scrims', fee: '0%', note: 'Unlimited free lobbies, no revenue share.' },
            { plan: 'Paid scrims', fee: '5%', note: 'On gross entry collection. Payout weekly.' },
            { plan: 'Tournaments < ₹1L', fee: '5%', note: 'Includes escrow, moderation tools, dispute cover.' },
            { plan: 'Tournaments ≥ ₹1L', fee: '3.5%', note: 'Volume discount + dedicated support manager.' },
          ].map((p) => (
            <div className="pay-opt" key={p.plan}>
              <span className="pi" style={{ fontSize: 10 }}>{p.fee}</span>
              <span className="grow" style={{ textAlign: 'left' }}>
                <b>{p.plan}</b>
                <span>{p.note}</span>
              </span>
            </div>
          ))}
        </Sheet>
      )}
    </>
  )
}

/* ── organiser event row ────────────────────────────────────────────────── */
function OrgEventRow({ e, onOpen, onManage }) {
  const [filled, total] = e.slots.split(' / ').map(Number)
  const live = e.status.includes('LIVE')
  return (
    <div className={cx('card pad tap', live && 'yellow-edge')} onClick={onOpen} style={{ padding: 12 }}>
      <div className="row gap-12">
        <Art variant={e.art} style={{ width: 52, height: 52, borderRadius: 14, flex: '0 0 auto' }} hex={false} />
        <div className="grow" style={{ minWidth: 0 }}>
          <b className="h-head truncate" style={{ fontSize: 13 }}>{e.name}</b>
          <span className="tiny faint truncate">
            {e.type} · {fmtDateShort(e.startsAt)} {fmtTime(e.startsAt)} · {e.status}
          </span>
          <div className="row gap-6" style={{ marginTop: 7 }}>
            <Badge tone={live ? 'red' : e.revenue ? 'green' : 'grey'} icon={live ? 'live' : e.revenue ? 'rupee' : 'clock'}>
              {live ? 'Live' : e.revenue ? inr(e.revenue) : 'Free'}
            </Badge>
            <Badge tone="blue">{e.slots} slots</Badge>
          </div>
        </div>
        <Icon name="chevronRight" className="faint" />
      </div>
      <div style={{ marginTop: 11 }}>
        <Progress value={filled} max={total} />
        <div className="row gap-8" style={{ marginTop: 10 }}>
          <Btn size="xs" variant="ghost" className="grow" icon="users" onClick={(ev) => { ev.stopPropagation(); onManage() }}>
            Manage
          </Btn>
          <Btn size="xs" variant="outline" className="grow" icon="key" onClick={(ev) => { ev.stopPropagation(); onManage() }}>
            Room ID
          </Btn>
          <CdInline target={e.startsAt} />
        </div>
      </div>
    </div>
  )
}

function WalletAction({ icon, label, onClick }) {
  return (
    <button className="wallet-action" onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  )
}
