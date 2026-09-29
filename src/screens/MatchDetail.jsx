/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Match detail (booking ticket · room access · results)
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon, MapGlyph } from '../icons'
import { Art, Avatar, Badge, Btn, CdInline, Countdown, EmptyState, InfoRow, Progress, ScreenHeader, SectionHead, Sheet, StatTile, Toggle } from '../ui'
import { ORG_RESULTS_TEMPLATE } from '../data'
import { useWG } from '../store'
import { cx, fmtDate, fmtTime, fmtWhen, inr, relTime } from '../utils'

export default function MatchDetail({ id }) {
  const { bookings, getEvent, teams, back, navigate, cancelBooking, toast, clock, live, sheet, openSheet, closeSheet, me, notify } = useWG()
  const booking = bookings.find((b) => b.id === id)
  const [remind, setRemind] = useState(true)
  const [revealed, setRevealed] = useState(false)

  const event = booking ? getEvent(booking.eventId) : null
  const team = booking ? teams.find((t) => t.id === booking.teamId) : null

  if (!booking || !event)
    return (
      <>
        <ScreenHeader title="Match" onBack={back} />
        <EmptyState icon="alert" title="Booking not found" body="This entry may have been cancelled." action="Back to My Matches" onAction={() => navigate('matches')} />
      </>
    )

  const releaseAt = booking.releaseAt || event.releaseAt || event.startsAt
  const isReleased = Boolean(booking.roomId || event.roomId) && new Date(releaseAt).getTime() <= clock
  const roomId = booking.roomId || event.roomId
  const roomPass = booking.roomPass || event.roomPass
  const isLive = event.status === 'live' || live.eventId === event.id
  const isDone = booking.status === 'completed' || event.status === 'completed'
  const cancelable = booking.status === 'confirmed' && !isDone && !isLive

  return (
    <>
      <ScreenHeader
        title={event.name}
        subtitle={`${booking.id.toUpperCase()} · ${fmtWhen(event.startsAt)}`}
        onBack={back}
        right={
          <>
            <button className="icon-btn" onClick={() => toast('Link copied', 'Share ticket with your squad', 'info')} aria-label="share">
              <Icon name="share" />
            </button>
            <button className="icon-btn" onClick={() => openSheet({ type: 'matchMenu' })} aria-label="more">
              <Icon name="dots" />
            </button>
          </>
        }
      />

      <div className="page">
        {/* ── status banner ────────────────────────────────────────────── */}
        <Art variant={event.art} style={{ height: 132, borderRadius: 20, marginTop: 2 }}>
          <div style={{ position: 'relative', zIndex: 6, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 13 }}>
            <div className="row gap-6">
              {isLive ? <Badge tone="red" icon="live">Live now</Badge> : isDone ? <Badge tone="grey" icon="checkCircle">Completed</Badge> : booking.status === 'waitlist' ? <Badge tone="yellow" icon="clock">Waitlist #{booking.waitlistPos}</Badge> : <Badge tone="green" icon="ticket">Confirmed</Badge>}
              <Badge tone="blue" icon="users">{event.mode}</Badge>
            </div>
            <div>
              <div className="h-head" style={{ fontSize: 16, textShadow: '0 3px 14px rgba(0,0,0,.85)' }}>{team?.name || `${me.handle} (Solo)`}</div>
              <div className="row gap-6" style={{ marginTop: 6 }}>
                <span className="mini-tag blue"><MapGlyph map={event.maps?.[0] || event.map} size={10} /> {event.maps?.[0] || event.map}</span>
                <span className="mini-tag"><Icon name="pin" size={10} /> Seat #{booking.seatNo || '—'}</span>
                <span className="mini-tag gold"><Icon name="trophy" size={10} /> {inr(event.prizePool)}</span>
              </div>
            </div>
          </div>
        </Art>

        {/* ── countdown ────────────────────────────────────────────────── */}
        {!isDone && (
          <div className="card pad" style={{ marginTop: 12 }}>
            <div className="row-between" style={{ marginBottom: 11 }}>
              <span className="kicker">{isLive ? 'Match in progress' : 'Lobby starts in'}</span>
              <span className="tiny faint">{fmtDate(event.startsAt)} · {fmtTime(event.startsAt)}</span>
            </div>
            {isLive ? (
              <div className="row gap-12">
                <div className="col grow">
                  <span className="kicker">Alive</span>
                  <b className="display" style={{ fontSize: 24, color: 'var(--red)' }}>{live.alive}</b>
                </div>
                <div className="col grow">
                  <span className="kicker">Kills</span>
                  <b className="display" style={{ fontSize: 24, color: 'var(--yellow)' }}>{live.kills}</b>
                </div>
                <div className="col grow">
                  <span className="kicker">Watching</span>
                  <b className="display" style={{ fontSize: 24 }}>{live.viewers.toLocaleString('en-IN')}</b>
                </div>
              </div>
            ) : (
              <Countdown target={event.startsAt} gold />
            )}
            <div className="divider" />
            <div className="row gap-10">
              <Toggle on={remind} onChange={(v) => { setRemind(v); toast(v ? 'Reminder on' : 'Reminder off', v ? 'We will ping you 30 and 10 minutes before start' : 'No reminders for this match', 'info') }} label="reminder" />
              <span className="small muted">Remind me before the lobby opens</span>
            </div>
          </div>
        )}

        {/* ── room credentials ─────────────────────────────────────────── */}
        {!isDone && (
          <section className="section">
            <SectionHead title="Room access" rule />
            <div className={cx('room-box', !isReleased && 'locked')}>
              <div className="row gap-10" style={{ justifyContent: 'center' }}>
                <Icon name={isReleased ? 'unlock' : 'lock'} className={isReleased ? 'yellow' : 'faint'} size={18} />
                <b className="h-head" style={{ fontSize: 13.5 }}>{isReleased ? 'Credentials released' : 'Locked until release time'}</b>
              </div>

              {isReleased ? (
                <>
                  <div className="room-grid">
                    <div className="room-cell">
                      <u>Room ID</u>
                      <b>{roomId}</b>
                    </div>
                    <div className="room-cell">
                      <u>Password</u>
                      <b>{revealed ? roomPass : '••••••'}</b>
                    </div>
                  </div>
                  <div className="row gap-8" style={{ marginTop: 11, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Btn size="xs" variant="ghost" icon={revealed ? 'eye' : 'lock'} onClick={() => setRevealed(!revealed)}>
                      {revealed ? 'Hide pass' : 'Reveal pass'}
                    </Btn>
                    <Btn size="xs" variant="ghost" icon="copy" onClick={() => toast('Copied', `ID ${roomId} · Pass ${roomPass}`, 'info')}>
                      Copy
                    </Btn>
                    <Btn size="xs" variant="yellow" icon="bolt" onClick={() => toast('Opening BGMI', 'Custom room → paste ID & password', 'success')}>
                      Join now
                    </Btn>
                  </div>
                  <div className="tiny faint" style={{ marginTop: 10 }}>Released {relTime(releaseAt)} · lobby closes 5 minutes after start</div>
                </>
              ) : (
                <>
                  <div className="tiny muted" style={{ marginTop: 9, lineHeight: 1.55 }}>
                    {event.organizer.name} releases the room ID {relTime(releaseAt)}. It appears here and in a push notification.
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
                    <Countdown target={releaseAt} size="sm" />
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── team members ─────────────────────────────────────────────── */}
        {booking.players?.length > 0 && (
          <section className="section">
            <SectionHead title="Team members" accent={`(${booking.players.length})`} rule action={team ? 'Manage' : null} onAction={() => navigate('teams')} />
            <div className="card pad">
              {booking.players.map((p, i) => (
                <div className="member-row" key={i}>
                  <Avatar name={p.name} tone={p.captain ? 'yellow' : 'blue'} size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 12.5 }}>
                      {p.name} {p.captain && <span className="captain-badge" style={{ marginLeft: 5 }}>CPT</span>}
                    </b>
                    <span className="truncate" style={{ fontSize: 10.5, fontFamily: 'var(--font-head)', letterSpacing: '.06em', color: 'var(--faint)' }}>
                      BGMI ID {p.bgmiId}
                    </span>
                  </div>
                  <Badge tone="grey">{p.role}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── results ──────────────────────────────────────────────────── */}
        {isDone && booking.result && (
          <section className="section">
            <SectionHead title="Your result" rule />
            <div className="card pad yellow-edge">
              <div className="row gap-12" style={{ marginBottom: 12 }}>
                <div className="col grow" style={{ alignItems: 'center' }}>
                  <span className="kicker">Position</span>
                  <b className="display" style={{ fontSize: 34, color: booking.result.position === 1 ? 'var(--yellow)' : '#fff' }}>#{booking.result.position}</b>
                  {booking.result.wwcd && <Badge tone="yellow" icon="crown">WWCD</Badge>}
                </div>
                <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line)' }} />
                <div className="col grow" style={{ alignItems: 'center' }}>
                  <span className="kicker">Prize credited</span>
                  <b className="display" style={{ fontSize: 26, color: 'var(--green)' }}>{inr(booking.result.earned)}</b>
                  <span className="tiny faint">to WarGrid Wallet</span>
                </div>
              </div>
              <div className="result-grid">
                <div className="result-cell"><u>Kills</u><b className="gold">{booking.result.kills}</b></div>
                <div className="result-cell"><u>Points</u><b className="green">{booking.result.points}</b></div>
                <div className="result-cell"><u>Damage</u><b className="blue">{booking.result.damage}</b></div>
                <div className="result-cell"><u>Survival</u><b>{Math.max(8, 26 - booking.result.position * 2)}m</b></div>
              </div>
            </div>

            <SectionHead title="Final points table" rule />
            <div className="card pad">
              {ORG_RESULTS_TEMPLATE.map((r) => (
                <div className={cx('lb-row', r.tag === team?.tag && 'me')} key={r.tag} style={{ marginBottom: 6 }}>
                  <span className={cx('rk', r.pos === 1 && 'top1', r.pos === 2 && 'top2', r.pos === 3 && 'top3')}>{r.pos}</span>
                  <Avatar name={r.team} tone={r.pos === 1 ? 'yellow' : r.pos === 2 ? 'cyan' : 'violet'} size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 12.5, fontFamily: 'var(--font-head)' }}>{r.team}</b>
                    <span className="tiny faint">{r.tag}</span>
                  </div>
                  <div className="lb-stats">
                    <div className="lb-stat"><u>Kills</u><b>{r.kills}</b></div>
                    <div className="lb-stat"><u>Pts</u><b className="gold">{r.points}</b></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="row gap-8" style={{ marginTop: 12 }}>
              <Btn variant="ghost" size="sm" className="grow" icon="chart" onClick={() => navigate('leaderboard')}>
                Leaderboard
              </Btn>
              <Btn variant="outline" size="sm" className="grow" icon="scale" onClick={() => openSheet({ type: 'dispute' })}>
                Raise dispute
              </Btn>
            </div>
          </section>
        )}

        {isDone && !booking.result && (
          <section className="section">
            <div className="card pad">
              <div className="row gap-10">
                <Icon name="clock" className="yellow" />
                <div className="small muted grow">Results are being verified by the organiser. Points and prize money usually post within 2 hours.</div>
              </div>
            </div>
          </section>
        )}

        {/* ── booking details ──────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Booking details" rule />
          <div className="card pad">
            <InfoRow icon="ticket" label="Booking ID" value={booking.id.toUpperCase()} />
            <InfoRow icon="calendar" label="Match time" value={`${fmtDate(event.startsAt)} · ${fmtTime(event.startsAt)}`} />
            <InfoRow icon="users" label="Format" value={`${event.mode} · ${event.squadSize} per squad`} right={<span className="val muted">{event.matches} matches</span>} />
            <InfoRow icon="rupee" label="Entry paid" value={booking.amount ? inr(booking.amount) : 'Free'} tone="gold" right={<span className="val green">{booking.amount ? (booking.method === 'upi' ? 'UPI' : booking.method === 'card' ? 'Card' : 'Wallet') : '—'}</span>} />
            <InfoRow icon="shieldCheck" label="Organiser" value={event.organizer.name} right={<span className="val blue">★ {event.organizer.rating}</span>} />
            <InfoRow icon="clock" label="Booked" value={relTime(booking.bookedAt)} />
          </div>
        </section>

        {/* ── actions ──────────────────────────────────────────────────── */}
        <div className="row gap-8" style={{ marginTop: 14, flexWrap: 'wrap' }}>
          <Btn variant="ghost" size="sm" className="grow" icon={event.type === 'scrim' ? 'crosshair' : 'trophy'} onClick={() => navigate('event', { id: event.id })}>
            Event page
          </Btn>
          <Btn variant="ghost" size="sm" className="grow" icon="calendar" onClick={() => toast('Added to calendar', event.name, 'info')}>
            Calendar
          </Btn>
        </div>
        {cancelable && (
          <Btn variant="danger" size="sm" block icon="close" style={{ marginTop: 8 }} onClick={() => openSheet({ type: 'cancelBooking' })}>
            Cancel registration
          </Btn>
        )}
        <div className="tiny faint" style={{ textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          Cancellation refunds {booking.amount ? inr(booking.amount) : 'your slot'} up to 24 hours before the lobby starts.
        </div>
        <div style={{ height: 10 }} />
      </div>

      {/* ── sheets ─────────────────────────────────────────────────────── */}
      {sheet?.type === 'cancelBooking' && (
        <Sheet
          title="Cancel registration?"
          subtitle={event.name}
          icon="alert"
          onClose={closeSheet}
          footer={
            <>
              <Btn variant="ghost" onClick={closeSheet}>Keep my slot</Btn>
              <Btn
                variant="danger"
                icon="trash"
                onClick={() => {
                  cancelBooking(booking.id)
                  closeSheet()
                  navigate('matches')
                }}
              >
                Cancel & refund
              </Btn>
            </>
          }
        >
          <div className="card pad" style={{ background: 'rgba(255,74,94,.07)', borderColor: 'rgba(255,74,94,.24)' }}>
            <div className="receipt-line"><span>Seat released</span><b>#{booking.seatNo || '—'}</b></div>
            <div className="receipt-line"><span>Refund</span><b className="green">{booking.amount ? inr(booking.amount) : 'No payment made'}</b></div>
            <div className="receipt-line"><span>Refund ETA</span><b>Instant to wallet</b></div>
          </div>
          <p className="small muted" style={{ marginTop: 12, lineHeight: 1.55 }}>
            Your squad loses its slot immediately and it goes to the waitlist. Repeated cancellations lower your WarGrid trust score.
          </p>
        </Sheet>
      )}

      {sheet?.type === 'dispute' && (
        <Sheet
          title="Raise a dispute"
          subtitle={`${event.name} · ${booking.id.toUpperCase()}`}
          icon="scale"
          onClose={closeSheet}
          footer={<Btn variant="primary" icon="send" onClick={() => { closeSheet(); notify({ kind: 'system', tone: 'red', title: 'Dispute filed', body: `DSP-${Math.floor(2200 + Math.random() * 99)} raised for ${event.name}. Our moderation team responds within 6 hours.` }); toast('Dispute submitted', 'Case ID sent to notifications', 'success') }}>Submit dispute</Btn>}
        >
          <div className="col gap-12">
            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>What went wrong?</div>
              {['Result recorded incorrectly', 'Prize not credited', 'Opponent cheating / teaming', 'Room ID never released', 'Other'].map((r, i) => (
                <button key={r} className={cx('pay-opt', i === 0 && 'sel')} style={{ padding: '11px 13px' }}>
                  <span className="grow" style={{ textAlign: 'left' }}><b style={{ fontSize: 12.5 }}>{r}</b></span>
                  <span className="radio" />
                </button>
              ))}
            </div>
            <div className="field">
              <label>Details</label>
              <textarea className="textarea" placeholder="Describe what happened, include timestamps and in-game names…" />
            </div>
            <div className="tiny faint">Disputes must be filed within 48 hours of match end. Attach screenshots for faster resolution.</div>
          </div>
        </Sheet>
      )}

      {sheet?.type === 'matchMenu' && (
        <Sheet title="Match options" icon="dots" onClose={closeSheet}>
          <div className="col gap-8">
            {[
              { icon: 'trophy', label: 'View event page', fn: () => navigate('event', { id: event.id }) },
              { icon: 'users', label: 'Manage squad roster', fn: () => navigate('teams') },
              { icon: 'wallet', label: 'Wallet & payments', fn: () => navigate('wallet') },
              { icon: 'bell', label: 'Notification settings', fn: () => navigate('notifications') },
              { icon: 'scale', label: 'Raise a dispute', fn: () => openSheet({ type: 'dispute' }) },
            ].map((o) => (
              <button
                key={o.label}
                className="list-row tap"
                onClick={() => { closeSheet(); setTimeout(o.fn, 180) }}
              >
                <span className="li"><Icon name={o.icon} /></span>
                <b className="grow" style={{ textAlign: 'left' }}>{o.label}</b>
                <Icon name="chevronRight" size={15} className="faint" />
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </>
  )
}
