/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Event detail (tournament + scrim)
   Banner · prize pool · entry · date · schedule · teams · slots · rules ·
   organiser profile · prize distribution · register
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon, MapGlyph } from '../icons'
import { Art, Avatar, Badge, Btn, CdInline, Countdown, InfoRow, LiveBadge, Progress, SectionHead, Sheet, SlotMeter } from '../ui'
import { useWG } from '../store'
import { cx, fmtDate, fmtTime, fmtWhen, inr, inrShort, pct, relTime } from '../utils'

export default function EventDetail({ id }) {
  const { getEvent, navigate, back, bookings, teams, clock, toast, joinWaitlist, sheet, openSheet, closeSheet, live } = useWG()
  const event = getEvent(id)
  const [following, setFollowing] = useState(false)
  const [tab, setTab] = useState('overview')

  const booking = useMemo(() => bookings.find((b) => b.eventId === id), [bookings, id])
  if (!event) {
    return (
      <>
        <div className="page" style={{ paddingTop: 60 }}>
          <div className="empty">
            <div className="ei"><Icon name="alert" /></div>
            <b>Event not found</b>
            <p>This lobby may have ended or been removed by the organiser.</p>
            <Btn variant="outline" size="sm" style={{ margin: '16px auto 0' }} onClick={back}>Go back</Btn>
          </div>
        </div>
      </>
    )
  }

  const isScrim = event.type === 'scrim'
  const left = Math.max(0, event.slotsTotal - event.slotsFilled)
  const full = left === 0
  const isLive = event.status === 'live' || (isScrim && live.eventId === event.id)
  const releaseAt = event.releaseAt || event.startsAt
  const released = Boolean(event.roomId) && new Date(releaseAt).getTime() <= clock
  const registered = booking && booking.status !== 'failed'

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'schedule', label: isScrim ? 'Lobby' : 'Schedule' },
    { id: 'prizes', label: 'Prizes' },
    { id: 'rules', label: 'Rules' },
    { id: 'teams', label: `Teams${event.registeredTeams ? ` · ${event.registeredTeams}` : ''}` },
  ]

  return (
    <>
      {/* ── immersive banner ─────────────────────────────────────────────── */}
      <Art variant={event.art} className="detail-hero" glow={isScrim ? 'rgba(232,255,58,.42)' : 'rgba(45,125,255,.5)'} style={{ height: 292, marginTop: 0, paddingTop: 0 }}>
        <div style={{ position: 'absolute', top: 10, left: 14, right: 14, zIndex: 8, display: 'flex', gap: 8 }}>
          <button className="back-btn" onClick={back} aria-label="back">
            <Icon name="chevronLeft" strokeWidth={2.4} />
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="icon-btn" onClick={() => toast('Link copied', 'Share this battle with your squad', 'info')} aria-label="share">
              <Icon name="share" />
            </button>
            <button className="icon-btn" onClick={() => openSheet({ type: 'eventRules', event })} aria-label="rules">
              <Icon name="list" />
            </button>
          </div>
        </div>

        <div className="hero-content">
          <div className="row gap-6 wrap" style={{ marginBottom: 9 }}>
            {isLive ? <LiveBadge label="Live now" /> : <Badge tone={event.entryFee ? 'yellow' : 'green'}>{event.entryFee ? inr(event.entryFee) + ' entry' : 'Free entry'}</Badge>}
            <Badge tone="blue" icon="users">{event.mode}</Badge>
            {event.tier && <Badge tone="violet">{event.tier} tier</Badge>}
            {event.status === 'completed' && <Badge tone="grey">Completed</Badge>}
          </div>
          <h1>{event.name}</h1>
          {event.subtitle && <div className="kicker" style={{ marginTop: 6, color: 'rgba(255,255,255,.7)', letterSpacing: '.16em' }}>{event.subtitle}</div>}
          <div className="org-line">
            <span className="org-chip">
              <Avatar name={event.organizer.name} tone={event.organizer.tone} size="sm" />
              <b>{event.organizer.name}</b>
              {event.organizer.verified && <Icon name="verified" className="verified" />}
            </span>
            <span className="kicker" style={{ color: 'rgba(255,255,255,.6)' }}>★ {event.organizer.rating} · {event.organizer.events} events</span>
          </div>
        </div>
      </Art>

      {/* ── headline numbers ─────────────────────────────────────────────── */}
      <div className="page" style={{ marginTop: -26, position: 'relative', zIndex: 6 }}>
        <div className="card pad blue-edge">
          <div className="row gap-12">
            <div className="col grow">
              <span className="kicker">Prize pool</span>
              <b className="display" style={{ fontSize: 22, color: 'var(--yellow)', marginTop: 3 }}>{inr(event.prizePool)}</b>
              {event.perKill ? <span className="tiny faint" style={{ marginTop: 2 }}>+ {inr(event.perKill)} per kill</span> : null}
            </div>
            <div className="col grow" style={{ alignItems: 'flex-end' }}>
              <span className="kicker">{isLive ? 'Started' : 'Starts'}</span>
              <b className="h-head" style={{ fontSize: 14, marginTop: 5, textAlign: 'right' }}>{fmtWhen(event.startsAt)}</b>
              <span className="tiny faint" style={{ marginTop: 2 }}>{isLive ? 'in progress' : relTime(event.startsAt)}</span>
            </div>
          </div>

          <div className="divider" />

          {!isLive && event.status !== 'completed' && (
            <div className="row gap-12" style={{ marginBottom: 13 }}>
              <Countdown target={event.startsAt} gold />
              <div className="grow">
                <SlotMeter filled={event.slotsFilled} total={event.slotsTotal} label={isScrim ? 'Lobby' : 'Squads'} />
                {event.waitlist > 0 && (
                  <div className="tiny faint" style={{ marginTop: 6 }}>
                    <Icon name="clock" size={10} style={{ display: 'inline', verticalAlign: '-1px' }} /> {event.waitlist} squads on waitlist
                  </div>
                )}
              </div>
            </div>
          )}

          {isLive && (
            <div className="row gap-8" style={{ marginBottom: 12 }}>
              <span className="mini-tag"><Icon name="eye" size={10} /> {live.viewers.toLocaleString('en-IN')} watching</span>
              <span className="mini-tag"><Icon name="crosshair" size={10} /> {live.kills} kills</span>
              <span className="mini-tag"><Icon name="users" size={10} /> {live.alive} alive</span>
            </div>
          )}

          {/* room id strip */}
          <div className={cx('room-box', !released && 'locked')} style={{ textAlign: 'left', padding: 12 }}>
            <div className="row gap-10">
              <span className="li" style={{ width: 34, height: 34, borderRadius: 11, display: 'grid', placeItems: 'center', background: released ? 'rgba(232,255,58,.14)' : 'rgba(255,255,255,.06)', border: `1px solid ${released ? 'rgba(232,255,58,.3)' : 'var(--line)'}`, color: released ? 'var(--yellow)' : 'var(--faint)' }}>
                <Icon name={released ? 'key' : 'lock'} size={15} />
              </span>
              <div className="grow">
                <div className="kicker">{released ? 'Room credentials released' : 'Room ID & password'}</div>
                <div className="h-head" style={{ fontSize: 13, marginTop: 3 }}>
                  {released ? `${event.roomId} · ${event.roomPass}` : `Unlocks ${relTime(releaseAt)} · pushed to My Matches`}
                </div>
              </div>
              {released && (
                <Btn size="xs" variant="yellow" icon="bolt" onClick={() => navigate('matches')}>
                  Join
                </Btn>
              )}
            </div>
          </div>
        </div>

        {/* ── tabs ─────────────────────────────────────────────────────── */}
        <div className="tabs" style={{ marginTop: 14 }}>
          {TABS.map((t) => (
            <button key={t.id} className={cx(tab === t.id && 'active')} onClick={() => setTab(t.id)} style={{ fontSize: 9.5, letterSpacing: '.08em' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div className="step-body">
            <div className="card pad" style={{ marginTop: 2 }}>
              <p style={{ fontSize: 12.8, lineHeight: 1.65, color: 'var(--ink-2)' }}>{event.description}</p>
              <div className="divider" />
              <InfoRow icon="calendar" label="Date" value={fmtDate(event.startsAt)} right={<span className="val muted">{fmtTime(event.startsAt)}</span>} />
              <InfoRow icon="users" label="Format" value={`${event.mode} · ${event.squadSize} player${event.squadSize > 1 ? 's' : ''}`} right={<span className="val muted">{event.matches} matches</span>} />
              <InfoRow icon="map" label="Maps" value={(event.maps || [event.map]).join(' · ')} />
              <InfoRow icon="pin" label="Region" value={event.region} right={<span className="val muted">Asia servers</span>} />
              <InfoRow icon="ticket" label="Entry fee" value={event.entryFee ? inr(event.entryFee) : 'Free'} tone="gold" right={<span className="val green">{event.entryFee ? 'Refundable till 24h' : 'No card needed'}</span>} />
              <InfoRow icon="trophy" label="Prize pool" value={inr(event.prizePool)} tone="gold" right={<span className="val yellow">{inrShort(event.prizePool)}</span>} />
              <InfoRow icon="crosshair" label="Per kill bonus" value={event.perKill ? inr(event.perKill) : 'Not applicable'} />
              <InfoRow icon="shieldCheck" label="Fair play" value="Spectated lobby · device check" right={<span className="val green">Active</span>} />
            </div>

            <SectionHead title="Why book on WarGrid" rule />
            <div className="stat-grid three" style={{ marginBottom: 4 }}>
              {[
                { icon: 'bolt', t: 'Instant slots', s: 'Book in under 60 seconds' },
                { icon: 'key', t: 'Auto room ID', s: 'Pushed 20 min before start' },
                { icon: 'money', t: 'Fast payouts', s: 'Prize in wallet < 24 hrs' },
              ].map((f) => (
                <div className="card pad" key={f.t} style={{ textAlign: 'center', padding: 13 }}>
                  <span className="li" style={{ width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(45,125,255,.14)', border: '1px solid rgba(45,125,255,.28)', color: 'var(--blue-hi)', margin: '0 auto 8px' }}>
                    <Icon name={f.icon} size={16} />
                  </span>
                  <b className="h-head" style={{ fontSize: 11.5, display: 'block' }}>{f.t}</b>
                  <span className="tiny faint" style={{ display: 'block', marginTop: 3, lineHeight: 1.35 }}>{f.s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SCHEDULE / LOBBY ─────────────────────────────────────────── */}
        {tab === 'schedule' && (
          <div className="step-body">
            <div className="card pad">
              <SectionHead title={isScrim ? 'Lobby plan' : 'Match schedule'} rule />
              <div className="timeline">
                {(event.schedule || []).map((s, i) => (
                  <div className={cx('tl-item', s.state === 'done' && 'done', s.state === 'now' && 'now')} key={i}>
                    <b>{s.n}</b>
                    <span>
                      {s.time} · {s.map}
                      {s.state === 'done' ? ' · completed' : s.state === 'now' ? ' · live' : ''}
                    </span>
                  </div>
                ))}
              </div>
              {isScrim && (
                <>
                  <div className="divider" />
                  <InfoRow icon="map" label="Map" value={event.map} />
                  <InfoRow icon="shield" label="Lobby tier" value={event.tier || 'Open'} />
                  <InfoRow icon="clock" label="Room ID release" value={relTime(event.releaseAt)} tone="gold" />
                  <InfoRow icon="users" label="Squad size" value={`${event.squadSize} players`} />
                </>
              )}
            </div>
          </div>
        )}

        {/* ── PRIZES ───────────────────────────────────────────────────── */}
        {tab === 'prizes' && (
          <div className="step-body">
            <div className="card pad yellow-edge">
              <div className="row-between" style={{ marginBottom: 12 }}>
                <div>
                  <div className="kicker">Total prize pool</div>
                  <b className="display" style={{ fontSize: 26, color: 'var(--yellow)' }}>{inr(event.prizePool)}</b>
                </div>
                <span className="li" style={{ width: 46, height: 46, borderRadius: 15, display: 'grid', placeItems: 'center', background: 'rgba(232,255,58,.12)', border: '1px solid rgba(232,255,58,.3)', color: 'var(--yellow)' }}>
                  <Icon name="trophy" size={22} />
                </span>
              </div>
              {(event.prizes || []).map((p) => (
                <div className={cx('prize-row', p.pos === 1 && 'first', p.pos === 2 && 'second', p.pos === 3 && 'third')} key={p.pos}>
                  <span className="pos">#{p.pos}</span>
                  <div>
                    <b className="h-head" style={{ fontSize: 12.5, display: 'block' }}>{p.label}</b>
                    <span className="tiny faint">{pct(p.amount, event.prizePool)}% of pool</span>
                  </div>
                  <span className="amt">{inr(p.amount)}</span>
                </div>
              ))}
              {event.perKill > 0 && (
                <div className="prize-row" style={{ marginTop: 4 }}>
                  <span className="pos" style={{ background: 'rgba(45,125,255,.16)', color: 'var(--blue-hi)' }}>
                    <Icon name="crosshair" size={14} />
                  </span>
                  <div>
                    <b className="h-head" style={{ fontSize: 12.5, display: 'block' }}>Per kill bonus</b>
                    <span className="tiny faint">Paid per elimination, uncapped</span>
                  </div>
                  <span className="amt" style={{ color: 'var(--blue-hi)' }}>{inr(event.perKill)}</span>
                </div>
              )}
              <div className="divider dashed" />
              <div className="tiny faint" style={{ lineHeight: 1.5 }}>
                Prizes are credited to your WarGrid Wallet within {event.prizePool > 500000 ? '48' : '24'} hours of the final match, after KYC verification of the winning captain.
              </div>
            </div>
          </div>
        )}

        {/* ── RULES ────────────────────────────────────────────────────── */}
        {tab === 'rules' && (
          <div className="step-body">
            <div className="card pad">
              <SectionHead title="Tournament rules" rule />
              {(event.rules || []).map((r, i) => (
                <div className="rule-item" key={i}>
                  <span className="n">{i + 1}</span>
                  <span>{r}</span>
                </div>
              ))}
              <div className="divider" />
              <div className="row gap-10">
                <span className="li red" style={{ width: 34, height: 34, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'rgba(255,74,94,.12)', border: '1px solid rgba(255,74,94,.28)', color: 'var(--red)' }}>
                  <Icon name="ban" size={15} />
                </span>
                <div className="tiny muted" style={{ lineHeight: 1.5 }}>
                  Hacking, teaming, smurfing or slot-selling results in a permanent WarGrid ban, device fingerprint block and forfeiture of all pending winnings.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TEAMS ────────────────────────────────────────────────────── */}
        {tab === 'teams' && (
          <div className="step-body">
            <div className="card pad">
              <div className="row-between" style={{ marginBottom: 12 }}>
                <div>
                  <div className="kicker">Registered</div>
                  <b className="display" style={{ fontSize: 22 }}>
                    {event.slotsFilled}
                    <span style={{ fontSize: 13, color: 'var(--faint)' }}> / {event.slotsTotal}</span>
                  </b>
                </div>
                <Badge tone={left <= 5 ? 'red' : 'green'} icon={left <= 5 ? 'fire' : 'check'}>
                  {left === 0 ? 'House full' : `${left} slots left`}
                </Badge>
              </div>
              <Progress value={event.slotsFilled} max={event.slotsTotal} thick />
              <div className="divider" />
              {SAMPLE_TEAMS.map((t, i) => (
                <div className="member-row" key={t.tag}>
                  <span className="rk num" style={{ width: 20, color: 'var(--faint)', fontFamily: 'var(--font-display)', fontSize: 11 }}>{i + 1}</span>
                  <Avatar name={t.name} tone={t.tone} size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 12.5 }}>{t.name}</b>
                    <span className="truncate" style={{ fontSize: 10.5 }}>{t.captain} · {t.rank}</span>
                  </div>
                  <Badge tone="grey">{t.tag}</Badge>
                </div>
              ))}
              <div className="tiny faint" style={{ textAlign: 'center', marginTop: 10 }}>
                + {Math.max(0, event.slotsFilled - SAMPLE_TEAMS.length)} more squads registered
              </div>
            </div>
          </div>
        )}

        {/* ── organiser profile ────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Organiser" rule />
          <div className="card pad">
            <div className="row gap-12">
              <Avatar name={event.organizer.name} tone={event.organizer.tone} size="lg" ring={event.organizer.verified} />
              <div className="grow" style={{ minWidth: 0 }}>
                <b className="h-head row gap-6" style={{ fontSize: 14.5 }}>
                  <span className="truncate">{event.organizer.name}</span>
                  {event.organizer.verified && <Icon name="verified" size={14} className="blue" />}
                </b>
                <div className="tiny muted" style={{ marginTop: 3 }}>
                  ★ {event.organizer.rating} · {event.organizer.events} events · since {event.organizer.since}
                </div>
                <div className="tiny faint" style={{ marginTop: 3 }}>{event.organizer.payout}</div>
              </div>
              <Btn
                size="xs"
                variant={following ? 'ghost' : 'outline'}
                icon={following ? 'check' : 'plus'}
                onClick={() => {
                  setFollowing(!following)
                  toast(following ? 'Unfollowed' : 'Following organiser', event.organizer.name, 'info')
                }}
              >
                {following ? 'Following' : 'Follow'}
              </Btn>
            </div>
            <p className="small muted" style={{ marginTop: 11, lineHeight: 1.55 }}>{event.organizer.bio}</p>
            <div className="stat-grid three" style={{ marginTop: 12 }}>
              <div className="meta-cell"><u>Followers</u><b className="blue">{(event.organizer.followers / 1000).toFixed(1)}K</b></div>
              <div className="meta-cell"><u>Events</u><b>{event.organizer.events}</b></div>
              <div className="meta-cell"><u>Rating</u><b className="green">{event.organizer.rating}</b></div>
            </div>
          </div>
        </section>
        <div style={{ height: 10 }} />
      </div>

      {/* ── sticky register bar ──────────────────────────────────────────── */}
      {!isLive && event.status !== 'completed' && (
        <div className="sticky-foot">
          <div className="price-col">
            <u>Entry fee</u>
            <b>{event.entryFee ? inr(event.entryFee) : 'FREE'}</b>
          </div>
          <div className="col" style={{ minWidth: 62 }}>
            <span className="kicker" style={{ fontSize: 8 }}>Slots left</span>
            <b className={cx('num', left <= 5 ? 'red' : 'green')} style={{ fontSize: 15 }}>{left}</b>
          </div>
          {registered ? (
            <Btn variant="ghost" icon="checkCircle" onClick={() => navigate('matches')}>
              Registered
            </Btn>
          ) : (
            <Btn
              variant={full ? 'outline' : 'primary'}
              cut
              icon={full ? 'clock' : 'bolt'}
              onClick={() => {
                if (full) {
                  joinWaitlist(event)
                  navigate('matches')
                } else {
                  navigate('booking', { id: event.id })
                }
              }}
            >
              {full ? 'Join Waitlist' : isScrim ? 'Book Slot' : 'Register Now'}
            </Btn>
          )}
        </div>
      )}

      {isLive && (
        <div className="sticky-foot">
          <div className="price-col">
            <u>Status</u>
            <b style={{ color: 'var(--red)', fontSize: 16 }}>LIVE</b>
          </div>
          <Btn variant="danger" icon="live" onClick={() => navigate('matches')}>
            Open match centre
          </Btn>
        </div>
      )}

      {event.status === 'completed' && (
        <div className="sticky-foot">
          <div className="price-col">
            <u>Status</u>
            <b style={{ fontSize: 15 }}>Completed</b>
          </div>
          <Btn variant="ghost" icon="chart" onClick={() => navigate('leaderboard')}>
            View results
          </Btn>
        </div>
      )}

      {/* rules quick sheet */}
      {sheet?.type === 'eventRules' && (
        <Sheet title="Quick rules" subtitle={event.name} icon="list" onClose={closeSheet} footer={<Btn variant="primary" icon={registered ? 'checkCircle' : 'bolt'} onClick={() => { closeSheet(); navigate('booking', { id: event.id }) }}>{registered ? 'View my entry' : 'Agree & continue'}</Btn>}>
          <div className="col gap-6">
            {(event.rules || []).slice(0, 5).map((r, i) => (
              <div className="rule-item" key={i}>
                <span className="n">{i + 1}</span>
                <span>{r}</span>
              </div>
            ))}
            <label className="row gap-10" style={{ marginTop: 8, cursor: 'pointer' }}>
              <span className="check sel" style={{ marginLeft: 0 }}><Icon name="check" strokeWidth={3} /></span>
              <span className="small muted">I accept the fair-play policy and WarGrid dispute terms.</span>
            </label>
          </div>
        </Sheet>
      )}
    </>
  )
}

const SAMPLE_TEAMS = [
  { name: 'Zone Zero Elite', tag: 'ZZE', captain: 'ZoneGod', rank: 'Rank #1 · India', tone: 'red' },
  { name: 'Nova Prime', tag: 'NVPM', captain: 'SilentKill', rank: 'Rank #2 · India', tone: 'violet' },
  { name: 'Phantom Squad', tag: 'PHNT', captain: 'GhostRifle', rank: 'Rank #3 · India', tone: 'blue' },
  { name: 'Clutch Kings', tag: 'CLKG', captain: 'xRAZOR', rank: 'Rank #4 · India', tone: 'green' },
  { name: 'Desi Fraggers', tag: 'DSFR', captain: 'AKSHAY_444', rank: 'Rank #5 · India', tone: 'yellow' },
]
