/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Booking flow
   1 review → 2 select squad → 3 BGMI IDs → 4 confirm members → 5 pay entry →
   6 confirmation ticket → 7 room ID / password → 8 added to My Matches
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useMemo, useState } from 'react'
import { Icon, MapGlyph } from '../icons'
import { Art, Avatar, Badge, Btn, CdInline, Countdown, EmptyState, Field, Input, Progress, SectionHead, Select, Sheet, Toggle } from '../ui'
import { useWG } from '../store'
import { FREE_AGENTS } from '../data'
import { cx, fmtDate, fmtTime, fmtWhen, inr, inrShort, relTime, uid } from '../utils'

const STEPS = [
  { key: 'review', label: 'Details', title: 'Review the battle', sub: 'Check the format, fee and rules before you lock the slot.' },
  { key: 'team', label: 'Squad', title: 'Select your squad', sub: 'Pick a saved team or enter solo. Roster size must match the format.' },
  { key: 'ids', label: 'BGMI IDs', title: 'Enter BGMI player IDs', sub: 'These IDs are used for lobby verification and result tracking.' },
  { key: 'confirm', label: 'Confirm', title: 'Confirm team members', sub: 'One last check — the organiser sees this exact roster.' },
  { key: 'pay', label: 'Payment', title: 'Pay entry fee', sub: 'Secure checkout. Entry is escrow-protected until the lobby starts.' },
  { key: 'done', label: 'Booked', title: 'Booking confirmed', sub: 'Your slot is locked and your ticket is ready.' },
  { key: 'access', label: 'Access', title: 'Match access', sub: 'Room credentials and your match centre entry.' },
]

export default function Booking({ id }) {
  const { getEvent, teams, freeAgents, wallet, addMoney, bookEvent, joinWaitlist, cancelBooking, navigate, back, toast, notify, clock, bookings, openSheet, closeSheet, sheet, me } = useWG()
  const event = getEvent(id)

  const existing = useMemo(() => bookings.find((b) => b.eventId === id && b.status !== 'failed'), [bookings, id])

  const [step, setStep] = useState(existing ? 5 : 0)
  const [teamId, setTeamId] = useState(existing?.teamId || null)
  const [players, setPlayers] = useState(existing?.players || [])
  const [accept, setAccept] = useState(Boolean(existing))
  const [method, setMethod] = useState('wallet')
  const [processing, setProcessing] = useState(false)
  const [booking, setBooking] = useState(existing || null)
  const [err, setErr] = useState('')
  const [notifyMe, setNotifyMe] = useState(true)

  useEffect(() => {
    if (event && !teamId) {
      const fit = teams.find((t) => t.mode === event.mode && t.members.length === event.squadSize)
      if (fit) {
        setTeamId(fit.id)
        setPlayers(fit.members.map((m) => ({ id: m.id, name: m.name, bgmiId: m.bgmiId, role: m.role, captain: m.captain })))
      } else if (event.squadSize === 1) {
        setTeamId('solo')
        setPlayers([{ id: 'p1', name: `${me.name.split(' ')[0]} "${me.handle}"`, bgmiId: me.bgmiId, role: 'Solo', captain: true }])
      }
    }
  }, [event]) // eslint-disable-line

  if (!event) return <EmptyState icon="alert" title="Event unavailable" body="This lobby is no longer accepting registrations." action="Back to feed" onAction={back} />

  const team = teams.find((t) => t.id === teamId)

  const isFull = event.slotsFilled >= event.slotsTotal
  const amount = event.entryFee || 0
  const insufficient = method === 'wallet' && wallet.balance < amount

  /* ── step guards ──────────────────────────────────────────────────────── */
  const validateIds = () => {
    if (players.length !== event.squadSize) return `Roster must have exactly ${event.squadSize} player${event.squadSize > 1 ? 's' : ''}.`
    for (const p of players) {
      if (!p.name?.trim()) return 'Every player needs an in-game name.'
      if (!/^\d{9,12}$/.test(String(p.bgmiId || ''))) return `${p.name || 'A player'} needs a valid 9–12 digit BGMI ID.`
    }
    const ids = players.map((p) => String(p.bgmiId))
    if (new Set(ids).size !== ids.length) return 'Two players share the same BGMI ID.'
    return ''
  }

  const next = () => {
    setErr('')
    if (step === 0 && !accept) return setErr('Accept the fair-play rules to continue.')
    if (step === 1 && !teamId) return setErr('Select a squad or choose to play solo.')
    if (step === 2) {
      const v = validateIds()
      if (v) return setErr(v)
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1))
  }

  const doPay = () => {
    setErr('')
    if (amount && insufficient) return setErr('Wallet balance is too low. Add money or pay with UPI.')
    setProcessing(true)
    setTimeout(() => {
      const b = bookEvent({
        event,
        team: teamId === 'solo' ? { id: 'solo', name: `${me.handle} (Solo)` } : team,
        players,
        method: amount === 0 ? 'free' : method,
        useWallet: method === 'wallet',
      })
      setProcessing(false)
      if (b.status === 'failed') {
        setErr('Payment failed. Try UPI or add money to your wallet.')
        toast('Payment failed', 'No money was deducted', 'error')
        return
      }
      setBooking(b)
      setStep(5)
      toast('Battle booked', `${event.name} · ${inr(amount)}${amount ? '' : ' · free entry'}`, 'success')
    }, 1500)
  }

  /* ── chrome ───────────────────────────────────────────────────────────── */
  const header = (
    <>
      <div className="app-header">
        <div className="row gap-10">
          <button className="back-btn" onClick={step === 0 ? back : () => setStep((s) => s - 1)} aria-label="back">
            <Icon name={step === 0 ? 'chevronLeft' : 'chevronLeft'} strokeWidth={2.4} />
          </button>
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="kicker blue">
              {booking?.status === 'waitlist' ? 'Waitlist entry' : `Booking · ${step + 1} of ${STEPS.length}`}
            </div>
            <div className="h-head truncate" style={{ fontSize: 15, marginTop: 2 }}>{event.name}</div>
          </div>
          <Badge tone={amount ? 'yellow' : 'green'}>{amount ? inr(amount) : 'FREE'}</Badge>
        </div>
      </div>
      {booking?.status !== 'waitlist' && (
        <div className="stepper">
          {STEPS.map((s, i) => (
            <div key={s.key} className={cx('st', i < step && 'done', i === step && 'active')}>
              <i />
            </div>
          ))}
        </div>
      )}
      <div className="step-head">
        {booking?.status === 'waitlist' ? (
          <>
            <h2>Waitlist status</h2>
            <p>This lobby is full — here is where you stand in the queue.</p>
          </>
        ) : (
          <>
            <h2>{STEPS[step].title}</h2>
            <p>{STEPS[step].sub}</p>
          </>
        )}
      </div>
    </>
  )

  const foot = (leftLabel, onLeft, rightLabel, onRight, opts = {}) => (
    <div className="step-foot">
      {leftLabel && (
        <Btn variant="ghost" className="back" onClick={onLeft} icon="chevronLeft" aria-label="back" />
      )}
      <Btn
        variant={opts.variant || 'primary'}
        cut
        iconRight={opts.iconRight || 'arrowRight'}
        icon={opts.icon}
        loading={opts.loading}
        disabled={opts.disabled}
        onClick={onRight}
      >
        {rightLabel}
      </Btn>
    </div>
  )

  /* ── already on the waitlist → dedicated status screen ────────────────── */
  if (booking?.status === 'waitlist')
    return (
      <>
        {header}
        <div className="page step-body">
          <div className="success-wrap">
            <div className="success-ring" style={{ background: 'radial-gradient(circle, rgba(232,255,58,.2), transparent 68%)' }}>
              <Icon name="clock" strokeWidth={2.4} style={{ color: 'var(--yellow)' }} />
            </div>
            <div className="kicker yellow">Waitlist position #{booking.waitlistPos}</div>
            <h2 className="display" style={{ fontSize: 20, marginTop: 6 }}>YOU'RE ON THE LIST</h2>
            <p className="small muted" style={{ marginTop: 8, lineHeight: 1.55 }}>
              {event.name} is full. If a squad drops out, WarGrid auto-books you in waitlist order and charges your wallet — you'll get a push the moment it happens.
            </p>
          </div>

          <div className="card pad yellow-edge" style={{ marginTop: 16 }}>
            <div className="row gap-10">
              <span className="li" style={{ width: 40, height: 40, borderRadius: 13, display: 'grid', placeItems: 'center', background: 'rgba(232,255,58,.12)', border: '1px solid rgba(232,255,58,.3)', color: 'var(--yellow)' }}>
                <Icon name="trophy" size={18} />
              </span>
              <div className="grow" style={{ minWidth: 0 }}>
                <b className="h-head truncate" style={{ fontSize: 13.5 }}>{event.name}</b>
                <span className="tiny faint truncate">{fmtWhen(event.startsAt)} · {event.mode} · {event.entryFee ? inr(event.entryFee) : 'Free'}</span>
              </div>
            </div>
            <div className="divider" />
            <div className="row-between" style={{ marginBottom: 9 }}>
              <span className="kicker">Lobby starts in</span>
              <CdInline target={event.startsAt} />
            </div>
            <Countdown target={event.startsAt} gold size="sm" />
            <div className="receipt-line" style={{ marginTop: 12 }}>
              <span>Ahead of you</span>
              <b>{Math.max(0, (booking.waitlistPos || 1) - 1)} squads</b>
            </div>
            <div className="receipt-line">
              <span>Drop-out rate for this organiser</span>
              <b className="green">~6 squads / hour</b>
            </div>
            <div className="receipt-line">
              <span>Auto-charge on promotion</span>
              <b>{event.entryFee ? inr(event.entryFee) : '₹0'}</b>
            </div>
          </div>

          <div className="row gap-8" style={{ marginTop: 14 }}>
            <Btn variant="ghost" size="sm" className="grow" icon="calendar" onClick={() => navigate('matches')}>
              My Matches
            </Btn>
            <Btn
              variant="danger"
              size="sm"
              className="grow"
              icon="close"
              onClick={() => {
                cancelBooking(booking.id)
                navigate('matches')
              }}
            >
              Leave waitlist
            </Btn>
          </div>
        </div>
      </>
    )

  /* ══ STEP 1 · REVIEW ═══════════════════════════════════════════════════ */
  if (step === 0)
    return (
      <>
        {header}
        <div className="page step-body">
          <Art variant={event.art} style={{ height: 132, borderRadius: 20 }}>
            <div style={{ position: 'relative', zIndex: 6, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 13 }}>
              <div className="row gap-6">
                <Badge tone="blue" icon="users">{event.mode}</Badge>
                <Badge tone={amount ? 'yellow' : 'green'}>{amount ? inr(amount) : 'Free entry'}</Badge>
              </div>
              <div className="banner-title" style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginTop: 7, textShadow: '0 3px 14px rgba(0,0,0,.8)' }}>{event.name}</div>
            </div>
          </Art>

          <div className="card pad" style={{ marginTop: 12 }}>
            <div className="meta-grid">
              <div className="meta-cell"><u>Date</u><b className="blue">{fmtDate(event.startsAt)}</b></div>
              <div className="meta-cell"><u>Time</u><b>{fmtTime(event.startsAt)}</b></div>
              <div className="meta-cell"><u>Entry</u><b className={amount ? 'yellow' : 'green'}>{amount ? inr(amount) : 'FREE'}</b></div>
              <div className="meta-cell"><u>Prize</u><b className="yellow">{inrShort(event.prizePool)}</b></div>
            </div>
            <div className="tagrow">
              <span className="mini-tag blue"><MapGlyph map={event.maps?.[0] || event.map} size={10} /> {(event.maps || [event.map]).join(' · ')}</span>
              <span className="mini-tag"><Icon name="users" size={10} /> {event.squadSize} per squad</span>
              <span className="mini-tag gold"><Icon name="trophy" size={10} /> {event.matches} matches</span>
              {event.perKill ? <span className="mini-tag green"><Icon name="crosshair" size={10} /> {inr(event.perKill)}/kill</span> : null}
            </div>
            <div style={{ marginTop: 11 }}>
              <div className="slot-line">
                <span>Slots</span>
                <span className={isFull ? 'red' : 'green'}>{isFull ? 'FULL · waitlist' : `${event.slotsTotal - event.slotsFilled} left`}</span>
              </div>
              <Progress value={event.slotsFilled} max={event.slotsTotal} />
            </div>
          </div>

          <SectionHead title="Key rules" rule action="All rules" onAction={() => setStep(0)} />
          <div className="card pad">
            {(event.rules || []).slice(0, 3).map((r, i) => (
              <div className="rule-item" key={i}>
                <span className="n">{i + 1}</span>
                <span>{r}</span>
              </div>
            ))}
            <div className="divider dashed" />
            <button className="row gap-10" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => setAccept(!accept)}>
              <span className={cx('check', accept && 'sel')} style={{ marginLeft: 0 }}>
                <Icon name="check" strokeWidth={3} />
              </span>
              <span className="small muted">I accept the rules, fair-play policy and the {amount ? 'non-refundable entry terms' : 'free entry terms'}.</span>
            </button>
          </div>

          {isFull && (
            <div className="card pad yellow-edge" style={{ marginTop: 12 }}>
              <div className="row gap-10">
                <Icon name="alert" className="yellow" />
                <div className="grow small muted">This lobby is full. You can join the waitlist — WarGrid auto-books you if a squad drops out.</div>
              </div>
            </div>
          )}
          {err && <div className="hint err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
        {isFull
          ? foot('Back', back, 'Join waitlist', () => { joinWaitlist(event); navigate('matches') }, { variant: 'outline', icon: 'clock', iconRight: null })
          : foot('Back', back, amount ? 'Continue to squad' : 'Continue', next, { disabled: !accept })}
      </>
    )

  /* ══ STEP 2 · SELECT TEAM ══════════════════════════════════════════════ */
  if (step === 1) {
    const compatible = teams.filter((t) => t.mode === event.mode)
    return (
      <>
        {header}
        <div className="page step-body">
          {event.squadSize === 1 && (
            <button className={cx('pay-opt', teamId === 'solo' && 'sel')} onClick={() => { setTeamId('solo'); setPlayers([{ id: 'p1', name: `${me.name.split(' ')[0]} "${me.handle}"`, bgmiId: me.bgmiId, role: 'Solo', captain: true }]) }}>
              <Avatar name={me.handle} tone="blue" size="md" />
              <div className="grow">
                <b>Play solo</b>
                <span>{me.handle} · {me.tier} · {me.bgmiId}</span>
              </div>
              <span className="radio" />
            </button>
          )}

          {compatible.length === 0 && (
            <EmptyState
              icon="users"
              title={`No ${event.mode} team saved`}
              body={`Create a ${event.mode.toLowerCase()} roster to register — it takes 20 seconds and you can reuse it for every battle.`}
              action="Create team"
              onAction={() => navigate('teams', { create: true })}
            />
          )}

          {compatible.map((t) => {
            const ok = t.members.length === event.squadSize
            return (
              <button
                key={t.id}
                className={cx('pay-opt', teamId === t.id && 'sel')}
                onClick={() => {
                  setTeamId(t.id)
                  setPlayers(t.members.map((m) => ({ id: m.id, name: m.name, bgmiId: m.bgmiId, role: m.role, captain: m.captain })))
                }}
              >
                <Avatar name={t.name} tone={t.art === 'art-3' ? 'green' : t.art === 'art-8' ? 'yellow' : 'blue'} size="md" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <b className="row gap-6">
                    <span className="truncate">{t.name}</span>
                    <span className="team-tag" style={{ fontSize: 9 }}>{t.tag}</span>
                  </b>
                  <span className="truncate">
                    {t.members.length}/{event.squadSize} players · {t.region}
                  </span>
                  <div className="row gap-4" style={{ marginTop: 7 }}>
                    {Array.from({ length: event.squadSize }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: 22,
                          height: 4,
                          borderRadius: 99,
                          background: i < t.members.length ? 'var(--blue)' : 'rgba(255,255,255,.12)',
                          boxShadow: i < t.members.length ? '0 0 8px rgba(45,125,255,.6)' : 'none',
                        }}
                      />
                    ))}
                    {!ok && <span className="tiny red" style={{ marginLeft: 6 }}>roster incomplete</span>}
                  </div>
                </div>
                <span className="radio" />
              </button>
            )
          })}

          <div className="row gap-8" style={{ marginTop: 12 }}>
            <Btn variant="outline" size="sm" icon="plus" className="grow" onClick={() => navigate('teams', { create: true })}>
              New team
            </Btn>
            <Btn variant="ghost" size="sm" icon="users" className="grow" onClick={() => navigate('teams')}>
              Manage squads
            </Btn>
          </div>
          {err && <div className="hint err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
        {foot('Back', () => setStep(0), 'Enter player IDs', next)}
      </>
    )
  }

  /* ══ STEP 3 · BGMI IDs ═════════════════════════════════════════════════ */
  if (step === 2) {
    const need = event.squadSize - players.length
    return (
      <>
        {header}
        <div className="page step-body">
          <div className="card pad" style={{ marginBottom: 12 }}>
            <div className="row gap-10">
              <Avatar name={team?.name || me.handle} tone="blue" size="md" />
              <div className="grow">
                <b className="h-head" style={{ fontSize: 13.5 }}>{team?.name || `${me.handle} (Solo)`}</b>
                <div className="tiny faint">{players.length}/{event.squadSize} slots filled · {event.mode}</div>
              </div>
              <Badge tone={need === 0 ? 'green' : 'yellow'}>{need === 0 ? 'Roster full' : `${need} to add`}</Badge>
            </div>
            <Progress value={players.length} max={event.squadSize} tone={need === 0 ? '' : 'gold'} style={{ marginTop: 11 }} />
          </div>

          {players.map((p, i) => (
            <div className={cx('roster-row', p.bgmiId ? 'filled' : 'empty')} key={p.id || i}>
              <span className="slot-n">{i + 1}</span>
              <div className="who grow">
                <Field label={`Player ${i + 1}${p.captain ? ' · Captain' : ''}`}>
                  <Input
                    value={p.name}
                    placeholder="In-game name"
                    onChange={(e) => setPlayers((ps) => ps.map((x, xi) => (xi === i ? { ...x, name: e.target.value } : x)))}
                  />
                </Field>
                <Field label="BGMI player ID">
                  <Input
                    value={p.bgmiId}
                    inputMode="numeric"
                    placeholder="9–12 digit numeric ID"
                    onChange={(e) => setPlayers((ps) => ps.map((x, xi) => (xi === i ? { ...x, bgmiId: e.target.value.replace(/\D/g, '').slice(0, 12) } : x)))}
                  />
                </Field>
              </div>
              <div className="col gap-6" style={{ alignSelf: 'flex-start' }}>
                <Select
                  className="role-sel"
                  value={p.role}
                  onChange={(e) => setPlayers((ps) => ps.map((x, xi) => (xi === i ? { ...x, role: e.target.value } : x)))}
                  style={{ padding: '7px 26px 7px 8px' }}
                >
                  {['IGL', 'Assault', 'Sniper', 'Support', 'Rusher', 'Solo'].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </Select>
                {players.length > 1 && (
                  <button className="copy-btn" style={{ marginLeft: 0 }} onClick={() => setPlayers((ps) => ps.filter((_, xi) => xi !== i))}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}

          {need > 0 && (
            <div className="card pad" style={{ marginTop: 12 }}>
              <SectionHead title="Add a player" rule />
              <div className="tiny faint" style={{ marginBottom: 9 }}>Invite a teammate or add from your WarGrid contacts.</div>
              {freeAgents.slice(0, 3).map((a) => (
                <div className="member-row" key={a.id}>
                  <Avatar name={a.name} tone="violet" size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 12 }}>{a.name}</b>
                    <span className="truncate" style={{ fontSize: 10 }}>{a.role} · {a.tier} · K/D {a.kd}</span>
                  </div>
                  <Btn size="xs" variant="outline" icon="plus" onClick={() => setPlayers((ps) => [...ps, { id: a.id, name: a.name, bgmiId: a.bgmiId, role: a.role, captain: false }])}>
                    Add
                  </Btn>
                </div>
              ))}
              <Btn
                variant="ghost"
                size="sm"
                block
                icon="edit"
                style={{ marginTop: 9 }}
                onClick={() =>
                  setPlayers((ps) => [...ps, { id: uid('p'), name: '', bgmiId: '', role: 'Assault', captain: false }])
                }
              >
                Add blank slot
              </Btn>
            </div>
          )}
          {err && <div className="hint err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
        {foot('Back', () => setStep(1), 'Confirm members', next)}
      </>
    )
  }

  /* ══ STEP 4 · CONFIRM MEMBERS ══════════════════════════════════════════ */
  if (step === 3)
    return (
      <>
        {header}
        <div className="page step-body">
          <div className="card pad blue-edge">
            <div className="row-between">
              <div>
                <div className="kicker">Squad</div>
                <b className="h-head" style={{ fontSize: 15 }}>{team?.name || `${me.handle} (Solo)`}</b>
              </div>
              <Badge tone="green" icon="checkCircle">Roster valid</Badge>
            </div>
            <div className="divider" />
            {players.map((p, i) => (
              <div className="member-row" key={i}>
                <span className="slot-n">{i + 1}</span>
                <Avatar name={p.name} tone={p.captain ? 'yellow' : 'blue'} size="sm" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <b className="truncate" style={{ fontSize: 12.5 }}>
                    {p.name} {p.captain && <span className="captain-badge" style={{ marginLeft: 5 }}>CPT</span>}
                  </b>
                  <span className="truncate" style={{ fontSize: 10.5, fontFamily: 'var(--font-head)', letterSpacing: '.06em' }}>
                    ID {p.bgmiId} · {p.role}
                  </span>
                </div>
                <Icon name="checkCircle" size={15} className="green" />
              </div>
            ))}
          </div>

          <div className="card pad" style={{ marginTop: 12 }}>
            <SectionHead title="Booking summary" rule />
            <div className="receipt">
              <div className="receipt-line"><span>Event</span><b className="truncate" style={{ maxWidth: 150 }}>{event.name}</b></div>
              <div className="receipt-line"><span>Starts</span><b>{fmtWhen(event.startsAt)}</b></div>
              <div className="receipt-line"><span>Format</span><b>{event.mode} · {event.squadSize}p</b></div>
              <div className="receipt-line"><span>Seat</span><b>#{event.slotsFilled + 1} of {event.slotsTotal}</b></div>
              <div className="receipt-line"><span>Entry fee</span><b>{amount ? inr(amount) : 'FREE'}</b></div>
              <div className="receipt-line"><span>Platform fee</span><b className="green">₹0</b></div>
              <div className="receipt-line total"><span>Total payable</span><b>{amount ? inr(amount) : '₹0'}</b></div>
            </div>
          </div>
          {err && <div className="hint err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
        {foot('Back', () => setStep(2), amount ? `Pay ${inr(amount)}` : 'Confirm free entry', next, { icon: amount ? 'lock' : 'check', iconRight: null })}
      </>
    )

  /* ══ STEP 5 · PAYMENT ══════════════════════════════════════════════════ */
  if (step === 4)
    return (
      <>
        {header}
        <div className="page step-body">
          {amount === 0 ? (
            <div className="card pad yellow-edge">
              <div className="row gap-12">
                <span className="li" style={{ width: 44, height: 44, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(232,255,58,.12)', border: '1px solid rgba(232,255,58,.3)', color: 'var(--yellow)' }}>
                  <Icon name="gift" size={20} />
                </span>
                <div className="grow">
                  <b className="h-head" style={{ fontSize: 14 }}>Free entry — nothing to pay</b>
                  <div className="tiny muted" style={{ marginTop: 4, lineHeight: 1.5 }}>
                    This lobby is sponsored. Confirm below and your slot is locked instantly.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="card pad" style={{ marginBottom: 12 }}>
                <div className="row-between">
                  <div>
                    <div className="kicker">Amount payable</div>
                    <b className="display" style={{ fontSize: 28, color: 'var(--yellow)' }}>{inr(amount)}</b>
                  </div>
                  <div className="col" style={{ alignItems: 'flex-end' }}>
                    <span className="kicker">Wallet balance</span>
                    <b className="num" style={{ fontSize: 15, color: wallet.balance >= amount ? 'var(--green)' : 'var(--red)' }}>{inr(wallet.balance)}</b>
                  </div>
                </div>
              </div>

              <SectionHead title="Payment method" rule />
              {[
                { id: 'wallet', icon: 'wallet', name: 'WarGrid Wallet', sub: `Balance ${inr(wallet.balance)} · instant` },
                { id: 'upi', icon: 'upi', name: 'UPI', sub: 'aarav@okhdfc · GPay, PhonePe, Paytm' },
                { id: 'card', icon: 'card', name: 'Card / Netbanking', sub: 'Visa, Mastercard, RuPay · 3-D secure' },
              ].map((m) => (
                <button key={m.id} className={cx('pay-opt', method === m.id && 'sel')} onClick={() => setMethod(m.id)}>
                  <span className="pi"><Icon name={m.icon} /></span>
                  <span className="grow" style={{ textAlign: 'left' }}>
                    <b>{m.name}</b>
                    <span>{m.sub}</span>
                  </span>
                  <span className="radio" />
                </button>
              ))}

              {insufficient && (
                <Btn variant="outline" size="sm" block icon="plus" style={{ marginTop: 10 }} onClick={() => openSheet({ type: 'addMoney' })}>
                  Add {inr(amount - wallet.balance)} to wallet
                </Btn>
              )}

              <div className="receipt" style={{ marginTop: 14 }}>
                <div className="receipt-line"><span>Entry fee · {event.name}</span><b>{inr(amount)}</b></div>
                <div className="receipt-line"><span>Platform fee</span><b className="green">₹0</b></div>
                <div className="receipt-line"><span>GST (included)</span><b>{inr(Math.round(amount * 0.18))}</b></div>
                <div className="receipt-line total"><span>Total</span><b>{inr(amount)}</b></div>
              </div>
              <div className="tiny faint" style={{ marginTop: 10, lineHeight: 1.55 }}>
                <Icon name="shieldCheck" size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 5 }} />
                Payments are held in escrow and released to the organiser only after the lobby starts. Cancelled lobbies refund automatically within 24 hours.
              </div>
            </>
          )}
          {err && <div className="hint err" style={{ marginTop: 10 }}>{err}</div>}
        </div>
        {foot('Back', () => setStep(3), amount ? `Pay ${inr(amount)}` : 'Confirm registration', doPay, { loading: processing, icon: 'lock', iconRight: null })}
      </>
    )

  /* ══ STEP 6 · CONFIRMATION ═════════════════════════════════════════════ */
  if (step === 5 && booking)
    return (
      <>
        {header}
        <div className="page step-body">
          <div className="success-wrap">
            <div className="success-ring">
              <Icon name="check" strokeWidth={3} />
            </div>
            <div className="kicker yellow">Slot locked · seat #{booking.seatNo || '—'}</div>
            <h2 className="display" style={{ fontSize: 21, marginTop: 6 }}>YOU'RE IN THE LOBBY</h2>
            <p className="small muted" style={{ marginTop: 7, lineHeight: 1.55 }}>
              {booking.players?.length || players.length} player{(booking.players?.length || players.length) > 1 ? 's' : ''} registered for {event.name}. Add it to My Matches and turn on reminders.
            </p>
          </div>

          <div className="ticket" style={{ marginTop: 16 }}>
            <div className="ticket-head">
              <div className="row gap-8">
                <Avatar name={event.organizer.name} tone={event.organizer.tone} size="sm" />
                <div>
                  <b className="h-head" style={{ fontSize: 12.5, display: 'block' }}>{event.name}</b>
                  <span className="tiny faint">{event.organizer.name}</span>
                </div>
              </div>
              <Badge tone="green" icon="checkCircle">Confirmed</Badge>
            </div>
            <div className="ticket-body">
              <div className="meta-grid">
                <div className="meta-cell"><u>Booking</u><b className="blue" style={{ fontSize: 11 }}>{booking.id.slice(-6).toUpperCase()}</b></div>
                <div className="meta-cell"><u>Date</u><b style={{ fontSize: 11.5 }}>{fmtDate(event.startsAt)}</b></div>
                <div className="meta-cell"><u>Time</u><b style={{ fontSize: 11.5 }}>{fmtTime(event.startsAt)}</b></div>
                <div className="meta-cell"><u>Paid</u><b className="yellow" style={{ fontSize: 11.5 }}>{booking.amount ? inr(booking.amount) : 'FREE'}</b></div>
              </div>
              <div className="divider dashed" />
              <div className="row-between">
                <div>
                  <div className="kicker">Squad</div>
                  <b className="h-head" style={{ fontSize: 13 }}>{team?.name || `${me.handle} (Solo)`}</b>
                </div>
                <div className="row gap-4">
                  {(booking.players || players).slice(0, 4).map((p, i) => (
                    <Avatar key={i} name={p.name} tone={p.captain ? 'yellow' : 'blue'} size="sm" />
                  ))}
                </div>
              </div>
              <div className="barcode" style={{ marginTop: 13 }}>
                {Array.from({ length: 34 }).map((_, i) => (
                  <i key={i} style={{ height: `${40 + ((i * 37) % 60)}%`, animationDelay: `${i * 0.012}s`, opacity: i % 3 === 0 ? 0.95 : 0.5 }} />
                ))}
              </div>
              <div className="tiny faint" style={{ textAlign: 'center', marginTop: 7, fontFamily: 'var(--font-head)', letterSpacing: '.2em' }}>
                {booking.id.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="row gap-8" style={{ marginTop: 14 }}>
            <Btn variant="ghost" size="sm" className="grow" icon="calendar" onClick={() => toast('Added to calendar', `${event.name} · ${fmtWhen(event.startsAt)}`, 'info')}>
              Calendar
            </Btn>
            <Btn variant="ghost" size="sm" className="grow" icon="share" onClick={() => toast('Invite sent', 'Squad notified on WhatsApp', 'info')}>
              Share
            </Btn>
          </div>
        </div>
        {foot(null, null, 'Match access', () => setStep(6), { icon: 'key', iconRight: null, variant: 'yellow' })}
      </>
    )

  /* ══ STEP 7 · MATCH ACCESS (room ID + My Matches) ══════════════════════ */
  if (step === 6 && booking) {
    const releaseAt = booking.releaseAt || event.releaseAt
    const isOpen = Boolean(booking.roomId || event.roomId) && new Date(releaseAt).getTime() <= clock
    const roomId = booking.roomId || event.roomId
    return (
      <>
        {header}
        <div className="page step-body">
          <div className={cx('room-box', !isOpen && 'locked')}>
            <div className="row gap-10" style={{ justifyContent: 'center' }}>
              <Icon name={isOpen ? 'key' : 'lock'} className={isOpen ? 'yellow' : 'faint'} size={20} />
              <b className="h-head" style={{ fontSize: 14 }}>{isOpen ? 'Room credentials released' : 'Room ID not released yet'}</b>
            </div>
            {isOpen ? (
              <>
                <div className="room-grid">
                  <div className="room-cell">
                    <u>Room ID</u>
                    <b>{roomId}</b>
                  </div>
                  <div className="room-cell">
                    <u>Password</u>
                    <b>{booking.roomPass || event.roomPass}</b>
                  </div>
                </div>
                <div className="row gap-8" style={{ marginTop: 11, justifyContent: 'center' }}>
                  <Btn size="xs" variant="ghost" icon="copy" onClick={() => toast('Copied', `${roomId} · ${booking.roomPass || event.roomPass}`, 'info')}>
                    Copy both
                  </Btn>
                  <Btn size="xs" variant="yellow" icon="bolt" onClick={() => navigate('matches')}>
                    Join lobby
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <div className="tiny muted" style={{ marginTop: 9, lineHeight: 1.55 }}>
                  The organiser releases the room ID and password {relTime(releaseAt)}. You'll get a push notification the second it drops.
                </div>
                <div style={{ marginTop: 12 }}>
                  <Countdown target={releaseAt} gold size="sm" />
                </div>
                <div className="row gap-10" style={{ marginTop: 13, justifyContent: 'center' }}>
                  <Toggle on={notifyMe} onChange={setNotifyMe} label="notify me" />
                  <span className="small muted">Notify me when the ID drops</span>
                </div>
              </>
            )}
          </div>

          <SectionHead title="Added to My Matches" rule />
          <div className="match-card tap" onClick={() => navigate('match', { id: booking.id })}>
            <span className="strip" />
            <div className="row gap-10">
              <span className="li" style={{ width: 38, height: 38, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(45,125,255,.14)', border: '1px solid rgba(45,125,255,.28)', color: 'var(--blue-hi)' }}>
                <Icon name={event.type === 'scrim' ? 'crosshair' : 'trophy'} size={16} />
              </span>
              <div className="grow" style={{ minWidth: 0 }}>
                <b className="truncate" style={{ fontFamily: 'var(--font-head)', fontSize: 13.5 }}>{event.name}</b>
                <span className="truncate" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {fmtWhen(event.startsAt)} · {team?.name || 'Solo'} · {booking.players?.length || players.length}p
                </span>
              </div>
              <CdInline target={event.startsAt} />
            </div>
            <div className="result-grid">
              <div className="result-cell"><u>Status</u><b className="green">Booked</b></div>
              <div className="result-cell"><u>Seat</u><b className="blue">#{booking.seatNo || '—'}</b></div>
              <div className="result-cell"><u>Room</u><b className={isOpen ? 'gold' : ''}>{isOpen ? 'Open' : 'Locked'}</b></div>
              <div className="result-cell"><u>Paid</u><b>{booking.amount ? inr(booking.amount) : 'Free'}</b></div>
            </div>
          </div>

          <div className="row gap-8" style={{ marginTop: 12 }}>
            <Btn variant="ghost" size="sm" className="grow" icon="ticket" onClick={() => navigate('matches')}>
              My Matches
            </Btn>
            <Btn variant="outline" size="sm" className="grow" icon="home" onClick={() => navigate('home')}>
              Back home
            </Btn>
          </div>
        </div>
        {foot(null, null, 'Finish', () => navigate('matches'), { icon: 'checkCircle', iconRight: null, variant: 'primary' })}
      </>
    )
  }

  /* fallback — no booking yet on later steps */
  return (
    <>
      {header}
      <div className="page">
        <EmptyState icon="ticket" title="No active booking" body="Start the flow again to lock a slot in this lobby." action="Start booking" onAction={() => setStep(0)} />
      </div>
    </>
  )
}
