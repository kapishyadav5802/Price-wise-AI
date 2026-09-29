/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Notifications
   Match starting soon · registration confirmed · room ID released ·
   results · prize credited · new tournaments · booking updates
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon } from '../icons'
import { Badge, Btn, Chip, EmptyState, ScreenHeader, SectionHead } from '../ui'
import { useWG } from '../store'
import { DAY, cx, fmtDayLabel, fmtTime, pick, relTime } from '../utils'

const KIND = {
  room: { icon: 'key', tone: 'gold' },
  match: { icon: 'clock', tone: 'red' },
  prize: { icon: 'trophy', tone: 'green' },
  booking: { icon: 'ticket', tone: 'blue' },
  result: { icon: 'chart', tone: 'blue' },
  new: { icon: 'sparkles', tone: 'gold' },
  team: { icon: 'users', tone: 'blue' },
  system: { icon: 'shieldCheck', tone: 'green' },
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'match', label: 'Matches' },
  { id: 'room', label: 'Room IDs' },
  { id: 'prize', label: 'Money' },
  { id: 'new', label: 'New events' },
]

export default function Notifications() {
  const { notifs, unread, markAllRead, markRead, clearNotifs, back, navigate, notify, toast, clock } = useWG()
  const [filter, setFilter] = useState('all')

  const list = useMemo(() => {
    let out = [...notifs].sort((a, b) => new Date(b.at) - new Date(a.at))
    if (filter === 'unread') out = out.filter((n) => !n.read)
    else if (filter === 'match') out = out.filter((n) => ['match', 'result', 'booking'].includes(n.kind))
    else if (filter === 'room') out = out.filter((n) => n.kind === 'room')
    else if (filter === 'prize') out = out.filter((n) => n.kind === 'prize')
    else if (filter === 'new') out = out.filter((n) => n.kind === 'new')
    return out
  }, [notifs, filter])

  const groups = useMemo(() => {
    const g = { Today: [], Yesterday: [], Earlier: [] }
    list.forEach((n) => {
      const age = clock - new Date(n.at).getTime()
      if (age < DAY && fmtDayLabel(n.at) === 'Today') g.Today.push(n)
      else if (age < 2 * DAY) g.Yesterday.push(n)
      else g.Earlier.push(n)
    })
    return g
  }, [list, clock])

  const open = (n) => {
    markRead(n.id)
    if (n.eventId) navigate('event', { id: n.eventId })
    else if (n.kind === 'prize' || n.kind === 'system') navigate('wallet')
    else if (n.kind === 'team') navigate('teams')
  }

  const simulatePush = () => {
    const opts = [
      { kind: 'match', tone: 'red', title: 'Match starting soon', body: 'Erangel Prime Scrim #219 lobby opens in 30 minutes. Warm up your squad.', eventId: 's1' },
      { kind: 'room', tone: 'gold', title: 'Room ID released', body: `Room ${Math.floor(10000000 + Math.random() * 89999999)} · Pass WG@${Math.floor(100 + Math.random() * 899)} — join in the next 10 minutes.`, eventId: 's1' },
      { kind: 'prize', tone: 'green', title: 'Prize credited', body: '₹1,500 added to your wallet for a #3 finish. Withdraw anytime.' },
      { kind: 'new', tone: 'gold', title: 'New tournament near you', body: 'Mumbai Midnight Cup · ₹75,000 prize pool · free entry for Conqueror tier.', eventId: 't7' },
    ]
    const n = pick(opts)
    notify(n)
    toast('New notification', n.title, 'info')
  }

  return (
    <>
      <ScreenHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'All caught up'}
        onBack={back}
        right={
          <button className="icon-btn" onClick={markAllRead} aria-label="mark all read" style={unread ? { borderColor: 'rgba(232,255,58,.4)', color: 'var(--yellow)' } : null}>
            <Icon name="checkCircle" />
          </button>
        }
      />

      <div className="page">
        <div className="chip-scroll edge" style={{ marginBottom: 14 }}>
          {FILTERS.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
              {f.id === 'unread' && unread > 0 && <span className="count">{unread}</span>}
            </Chip>
          ))}
        </div>

        {list.length === 0 ? (
          <EmptyState
            icon="bell"
            title={filter === 'all' ? 'No notifications yet' : 'Nothing in this filter'}
            body="Room IDs, results, prize credits and new tournaments land here the second they happen."
            action="Preview a live push"
            onAction={simulatePush}
          />
        ) : (
          Object.entries(groups).map(
            ([label, items]) =>
              items.length > 0 && (
                <section key={label} style={{ marginBottom: 18 }}>
                  <SectionHead title={label} accent={`(${items.length})`} rule />
                  <div className="stagger">
                    {items.map((n) => {
                      const k = KIND[n.kind] || KIND.system
                      return (
                        <div key={n.id} className={cx('notif tap', !n.read && 'unread')} onClick={() => open(n)}>
                          <span className={cx('ni', k.tone)}>
                            <Icon name={k.icon} />
                          </span>
                          <div className="grow" style={{ minWidth: 0 }}>
                            <b>{n.title}</b>
                            <p>{n.body}</p>
                            <time>{relTime(n.at)} · {fmtTime(n.at)}</time>
                          </div>
                          {!n.read && <span className="live-dot" style={{ background: 'var(--blue)', boxShadow: '0 0 10px var(--blue)', marginTop: 6 }} />}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )
          )
        )}

        <div className="row gap-8">
          <Btn variant="ghost" size="sm" className="grow" icon="bolt" onClick={simulatePush}>
            Preview live push
          </Btn>
          {notifs.length > 0 && (
            <Btn variant="ghost" size="sm" className="grow" icon="trash" onClick={() => { clearNotifs(); toast('Notifications cleared', 'Your alert history is empty', 'info') }}>
              Clear all
            </Btn>
          )}
        </div>
        <div className="tiny faint" style={{ textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          Alert preferences live in Profile → Notification settings.
        </div>
        <div style={{ height: 8 }} />
      </div>
    </>
  )
}
