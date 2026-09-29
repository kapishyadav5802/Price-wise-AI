/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Admin control room
   User management · organiser verification · tournament approval ·
   payment monitoring · disputes · reports · banned users · moderation
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon } from '../icons'
import { Avatar, Badge, Btn, Chip, CountUp, EmptyState, Progress, ScreenHeader, SectionHead, Sheet, StatTile } from '../ui'
import { useWG } from '../store'
import { cx, fmtDateShort, inr, inrShort, relTime, sum } from '../utils'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'verification', label: 'Verification' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'payments', label: 'Payments' },
  { id: 'disputes', label: 'Disputes' },
  { id: 'reports', label: 'Reports' },
  { id: 'bans', label: 'Bans' },
]

const toneFor = (s) =>
  ({ Active: 'green', Flagged: 'yellow', Banned: 'red', Success: 'green', Pending: 'yellow', Processing: 'blue', Failed: 'red', Open: 'red', 'In review': 'yellow', Resolved: 'green' }[s] || 'grey')

export default function Admin() {
  const { admin, back, navigate, toast, approveEvent, rejectEvent, verifyOrganizer, banUser, unbanUser, resolveDispute, adminAct, sheet, openSheet, closeSheet, notify, clock } = useWG()
  const [tab, setTab] = useState('overview')
  const [q, setQ] = useState('')
  const [payFilter, setPayFilter] = useState('all')

  const { stats, users, verifications, approvals, payments, disputes, reports, banned } = admin

  const counts = {
    users: users.length,
    verification: verifications.length,
    approvals: approvals.length,
    payments: payments.filter((p) => p.status !== 'Success').length,
    disputes: disputes.filter((d) => d.status !== 'Resolved').length,
    reports: reports.filter((r) => r.status !== 'Dismissed').length,
    bans: banned.length,
  }

  const filteredUsers = users.filter((u) => !q || `${u.name} ${u.handle}`.toLowerCase().includes(q.toLowerCase()))
  const filteredPayments = payments.filter((p) => (payFilter === 'all' ? true : p.status.toLowerCase() === payFilter))
  const gmv = sum(payments.filter((p) => p.status === 'Success'), (p) => p.amount)

  return (
    <>
      <ScreenHeader
        title="Admin control room"
        subtitle="WarGrid Trust & Safety · India region"
        onBack={back}
        right={
          <button className="icon-btn" onClick={() => openSheet({ type: 'adminTools' })} aria-label="tools" style={{ borderColor: 'rgba(255,74,94,.4)', color: '#ff97a3' }}>
            <Icon name="shield" />
          </button>
        }
      />

      <div className="page">
        <div className="chip-scroll edge" style={{ marginBottom: 14 }}>
          {TABS.map((t) => (
            <Chip key={t.id} active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
              {counts[t.id] ? <span className="count">{counts[t.id]}</span> : null}
            </Chip>
          ))}
        </div>

        {/* ══ OVERVIEW ═══════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="step-body">
            <div className="hub-card red" style={{ marginBottom: 14 }}>
              <div className="row-between">
                <div>
                  <div className="kicker" style={{ color: 'rgba(255,255,255,.6)' }}>Platform health</div>
                  <b className="display" style={{ fontSize: 20, marginTop: 4 }}>ALL SYSTEMS NOMINAL</b>
                </div>
                <span className="live-dot green" style={{ width: 10, height: 10 }} />
              </div>
              <div className="row gap-8" style={{ marginTop: 12, flexWrap: 'wrap' }}>
                <Badge tone="green" icon="live">{stats.liveEvents} live events</Badge>
                <Badge tone="blue" icon="users">{stats.newToday} new users today</Badge>
                <Badge tone="yellow" icon="alert">{stats.disputes} open disputes</Badge>
              </div>
            </div>

            <div className="stat-grid">
              <StatTile label="Total users" value={stats.users} sub={`+${stats.newToday} today`} icon="users" spark={stats.spark} />
              <StatTile label="GMV today" value={stats.gmvToday} prefix="₹" sub={`${inrShort(stats.gmv)} lifetime`} tone="gold" icon="rupee" />
              <StatTile label="Verified organisers" value={stats.organizers} sub="12 pending review" tone="green" icon="shieldCheck" />
              <StatTile label="Flagged accounts" value={stats.flagged} sub="3 auto-banned this week" tone="red" icon="ban" />
            </div>

            <section className="section">
              <SectionHead title="Moderation queue" rule />
              <div className="card pad">
                {[
                  { i: 'trophy', t: `${approvals.length} tournaments awaiting approval`, s: 'Oldest submitted ' + (approvals.length ? relTime(approvals[approvals.length - 1].submitted) : '—'), tone: 'blue', go: 'approvals' },
                  { i: 'verified', t: `${verifications.length} organiser verifications`, s: 'KYC documents uploaded', tone: 'gold', go: 'verification' },
                  { i: 'scale', t: `${disputes.filter((d) => d.status !== 'Resolved').length} disputes to resolve`, s: `${inr(sum(disputes.filter((d) => d.status === 'Open'), (d) => d.amount))} at stake`, tone: 'red', go: 'disputes' },
                  { i: 'alert', t: `${reports.filter((r) => r.status === 'Open').length} player reports`, s: '1 critical · aimbot allegation', tone: 'red', go: 'reports' },
                  { i: 'money', t: `${payments.filter((p) => p.status === 'Failed' || p.status === 'Pending').length} payments need attention`, s: 'Auto-retry enabled', tone: 'yellow', go: 'payments' },
                ].map((x) => (
                  <button className="list-row tap" key={x.t} style={{ background: 'transparent', border: 'none', padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,.05)', borderRadius: 0 }} onClick={() => setTab(x.go)}>
                    <span className={cx('li', x.tone === 'gold' && 'gold', x.tone === 'red' && 'red', x.tone === 'yellow' && '', x.tone === 'green' && 'green')}>
                      <Icon name={x.i} />
                    </span>
                    <span className="grow" style={{ textAlign: 'left' }}>
                      <b className="truncate">{x.t}</b>
                      <span className="truncate">{x.s}</span>
                    </span>
                    <Icon name="chevronRight" className="faint chev" />
                  </button>
                ))}
              </div>
            </section>

            <section className="section">
              <SectionHead title="Live events under monitoring" rule />
              <div className="card pad">
                {['WarGrid Weekly Wars #37', 'Erangel Prime Scrim #218', 'Night Raid TDM Cup (qualifier)'].map((n, i) => (
                  <div className="member-row" key={n}>
                    <span className="live-dot" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="truncate" style={{ fontSize: 12.5 }}>{n}</b>
                      <span className="tiny faint">Spectated · {120 + i * 40} squads · 0 flags</span>
                    </div>
                    <Badge tone="green">Healthy</Badge>
                  </div>
                ))}
              </div>
            </section>

            <section className="section">
              <SectionHead title="Reports (7 days)" rule />
              <div className="card pad">
                <div className="stat-grid three">
                  <StatTile label="Cheating" value={4} sub="3 confirmed" tone="red" icon="ban" />
                  <StatTile label="Toxicity" value={11} sub="6 warnings sent" tone="gold" icon="alert" />
                  <StatTile label="Payment" value={3} sub="all resolved" tone="green" icon="money" />
                </div>
                <div className="divider" />
                <div className="row-between tiny muted">
                  <span>Resolution SLA</span>
                  <b className="green">4.2 hrs avg · target 6 hrs</b>
                </div>
                <Progress value={70} max={100} tone="gold" style={{ marginTop: 8 }} />
              </div>
            </section>
          </div>
        )}

        {/* ══ USERS ══════════════════════════════════════════════════════ */}
        {tab === 'users' && (
          <div className="step-body">
            <div className="searchbar" style={{ marginBottom: 13 }}>
              <Icon name="search" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user or handle…" />
            </div>
            <div className="stat-grid three" style={{ marginBottom: 13 }}>
              <StatTile label="Active" value={users.filter((u) => u.status === 'Active').length} sub="players + organisers" tone="green" icon="users" />
              <StatTile label="Flagged" value={users.filter((u) => u.status === 'Flagged').length} sub="under review" tone="gold" icon="alert" />
              <StatTile label="Banned" value={users.filter((u) => u.status === 'Banned').length + banned.length} sub="device blocked" tone="red" icon="ban" />
            </div>

            <div className="col gap-8 stagger">
              {filteredUsers.map((u) => (
                <div className="card pad" key={u.id} style={{ padding: 12 }}>
                  <div className="row gap-10">
                    <Avatar name={u.handle} tone={u.tone} size="md" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="h-head truncate" style={{ fontSize: 13 }}>{u.name}</b>
                      <span className="tiny faint truncate">@{u.handle} · {u.role} · joined {u.joined}</span>
                      <div className="row gap-6" style={{ marginTop: 6 }}>
                        <Badge tone={toneFor(u.status)}>{u.status}</Badge>
                        <Badge tone="grey">{u.events} events</Badge>
                        {u.spend > 0 && <Badge tone="blue">{inr(u.spend)} spent</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="row gap-8" style={{ marginTop: 10 }}>
                    <Btn size="xs" variant="ghost" className="grow" icon="eye" onClick={() => toast('Player dossier', `${u.handle} · ${u.events} events · trust score 92`, 'info')}>
                      Dossier
                    </Btn>
                    {u.status === 'Active' && (
                      <Btn size="xs" variant="outline" className="grow" icon="flag" onClick={() => { adminAct('users', u.id, { status: 'Flagged', tone: 'yellow' }, { title: 'Account flagged', sub: `${u.handle} sent to moderation review` }, 'warn') }}>
                        Flag
                      </Btn>
                    )}
                    {u.status === 'Flagged' && (
                      <>
                        <Btn size="xs" variant="success" className="grow" icon="check" onClick={() => adminAct('users', u.id, { status: 'Active', tone: 'green' }, { title: 'Cleared', sub: `${u.handle} is back in good standing` })}>
                          Clear
                        </Btn>
                        <Btn size="xs" variant="danger" className="grow" icon="ban" onClick={() => banUser(u)}>
                          Ban
                        </Btn>
                      </>
                    )}
                    {u.status === 'Banned' && (
                      <Btn size="xs" variant="outline" className="grow" icon="refresh" onClick={() => adminAct('users', u.id, { status: 'Active', tone: 'green' }, { title: 'Ban lifted', sub: u.handle }, 'info')}>
                        Reinstate
                      </Btn>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && <EmptyState icon="search" title="No users matched" body="Search by name or in-game handle." />}
            </div>
          </div>
        )}

        {/* ══ VERIFICATION ═══════════════════════════════════════════════ */}
        {tab === 'verification' && (
          <div className="step-body">
            <SectionHead title="Organiser verification" accent={`${verifications.length} pending`} rule />
            {verifications.length === 0 ? (
              <EmptyState icon="verified" title="Queue clear" body="Every organiser application has been reviewed." />
            ) : (
              <div className="col gap-10 stagger">
                {verifications.map((v) => (
                  <div className={cx('card pad', v.risk === 'High' && 'yellow-edge')} key={v.id}>
                    <div className="row gap-10">
                      <Avatar name={v.org} tone={v.risk === 'High' ? 'red' : v.risk === 'Medium' ? 'yellow' : 'green'} size="md" />
                      <div className="grow" style={{ minWidth: 0 }}>
                        <b className="h-head truncate" style={{ fontSize: 13.5 }}>{v.org}</b>
                        <span className="tiny faint truncate">Owner {v.owner} · submitted {relTime(v.submitted)}</span>
                      </div>
                      <Badge tone={v.risk === 'High' ? 'red' : v.risk === 'Medium' ? 'yellow' : 'green'} icon={v.risk === 'High' ? 'alert' : 'shieldCheck'}>
                        {v.risk} risk
                      </Badge>
                    </div>
                    <div className="meta-grid" style={{ marginTop: 11 }}>
                      <div className="meta-cell"><u>Events</u><b>{v.events}</b></div>
                      <div className="meta-cell"><u>Followers</u><b>{v.followers.toLocaleString('en-IN')}</b></div>
                      <div className="meta-cell"><u>Docs</u><b className={v.docs.includes('Aadhaar only') ? 'red' : 'green'}>{v.docs.split(' + ').length}</b></div>
                      <div className="meta-cell"><u>Score</u><b className={v.risk === 'High' ? 'red' : 'blue'}>{v.risk === 'High' ? 42 : v.risk === 'Medium' ? 68 : 91}</b></div>
                    </div>
                    <div className="tiny faint" style={{ marginTop: 8 }}>Documents: {v.docs}</div>
                    <div className="row gap-8" style={{ marginTop: 11 }}>
                      <Btn size="xs" variant="ghost" className="grow" icon="eye" onClick={() => toast('Document viewer', 'PAN + GST + Aadhaar opened', 'info')}>
                        View docs
                      </Btn>
                      <Btn size="xs" variant="danger" className="grow" icon="close" onClick={() => verifyOrganizer(v, false)}>
                        Reject
                      </Btn>
                      <Btn size="xs" variant="success" className="grow" icon="verified" onClick={() => verifyOrganizer(v, true)}>
                        Verify
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ APPROVALS ══════════════════════════════════════════════════ */}
        {tab === 'approvals' && (
          <div className="step-body">
            <SectionHead title="Tournament approval" accent={`${approvals.length} in queue`} rule />
            {approvals.length === 0 ? (
              <EmptyState icon="checkCircle" title="All approved" body="No tournaments are waiting on moderation." />
            ) : (
              <div className="col gap-10 stagger">
                {approvals.map((a) => (
                  <div className={cx('card pad', a.risk === 'High' && 'yellow-edge')} key={a.id}>
                    <div className="row gap-10">
                      <span className={cx('li', a.risk === 'High' ? 'red' : a.type === 'Scrim' ? 'gold' : '')}>
                        <Icon name={a.type === 'Scrim' ? 'crosshair' : 'trophy'} />
                      </span>
                      <div className="grow" style={{ minWidth: 0 }}>
                        <b className="h-head truncate" style={{ fontSize: 13.5 }}>{a.event}</b>
                        <span className="tiny faint truncate">{a.org} · {a.type} · submitted {relTime(a.submitted)}</span>
                      </div>
                      <Badge tone={a.risk === 'High' ? 'red' : 'green'}>{a.risk}</Badge>
                    </div>
                    <div className="meta-grid" style={{ marginTop: 11 }}>
                      <div className="meta-cell"><u>Prize</u><b className="yellow">{inrShort(a.prize)}</b></div>
                      <div className="meta-cell"><u>Entry</u><b>{a.entry ? inr(a.entry) : 'FREE'}</b></div>
                      <div className="meta-cell"><u>Slots</u><b className="blue">{a.slots}</b></div>
                      <div className="meta-cell"><u>Max gross</u><b>{inrShort(a.entry * a.slots)}</b></div>
                    </div>
                    {a.risk === 'High' && (
                      <div className="card pad" style={{ marginTop: 10, background: 'rgba(255,74,94,.08)', borderColor: 'rgba(255,74,94,.26)', padding: 10 }}>
                        <div className="row gap-8">
                          <Icon name="alert" size={14} className="red" />
                          <span className="tiny" style={{ color: '#ffb8c0', lineHeight: 1.45 }}>
                            Automated risk: prize pool is {Math.round(a.prize / Math.max(1, a.entry * a.slots))}× the maximum possible gross revenue. Escrow pre-funding required.
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="row gap-8" style={{ marginTop: 11 }}>
                      <Btn size="xs" variant="ghost" className="grow" icon="eye" onClick={() => navigate('tournaments')}>
                        Preview
                      </Btn>
                      <Btn size="xs" variant="danger" className="grow" icon="close" onClick={() => rejectEvent(a)}>
                        Reject
                      </Btn>
                      <Btn size="xs" variant="success" className="grow" icon="check" onClick={() => approveEvent(a)}>
                        Approve
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ PAYMENTS ═══════════════════════════════════════════════════ */}
        {tab === 'payments' && (
          <div className="step-body">
            <div className="stat-grid three" style={{ marginBottom: 13 }}>
              <StatTile label="Cleared today" value={gmv} prefix="₹" sub={`${payments.filter((p) => p.status === 'Success').length} txns`} tone="green" icon="money" />
              <StatTile label="Pending" value={payments.filter((p) => p.status === 'Pending' || p.status === 'Processing').length} sub="auto-retry on" tone="gold" icon="clock" />
              <StatTile label="Failed" value={payments.filter((p) => p.status === 'Failed').length} sub="refunded automatically" tone="red" icon="alert" />
            </div>

            <div className="chip-scroll edge" style={{ marginBottom: 13 }}>
              {['all', 'Success', 'Pending', 'Processing', 'Failed'].map((f) => (
                <Chip key={f} active={payFilter === f} onClick={() => setPayFilter(f)}>
                  {f === 'all' ? 'All' : f}
                </Chip>
              ))}
            </div>

            <div className="dtable">
              <div className="tr head">
                <span className="c1">Txn / user</span>
                <span className="c2">Event</span>
                <span className="c3">Amount</span>
              </div>
              {filteredPayments.map((p) => (
                <div className="tr" key={p.id} style={{ display: 'block', padding: '10px 12px' }}>
                  <div className="row gap-8">
                    <span className="grow" style={{ minWidth: 0 }}>
                      <b className="truncate" style={{ display: 'block', fontSize: 12 }}>{p.txn}</b>
                      <span className="tiny faint truncate">@{p.user} · {p.method} · {relTime(p.at)}</span>
                    </span>
                    <Badge tone={toneFor(p.status)}>{p.status}</Badge>
                  </div>
                  <div className="row gap-8" style={{ marginTop: 8 }}>
                    <span className="tiny muted grow truncate">{p.event}</span>
                    <b className="num" style={{ fontSize: 13, color: p.status === 'Failed' ? '#ff8b98' : 'var(--ink)' }}>{inr(p.amount)}</b>
                    {p.status !== 'Success' && (
                      <Btn
                        size="xs"
                        variant={p.status === 'Failed' ? 'danger' : 'outline'}
                        onClick={() =>
                          p.status === 'Failed'
                            ? adminAct('payments', p.id, { status: 'Pending' }, { title: 'Retry queued', sub: `${p.txn} re-attempted via ${p.method}` }, 'info')
                            : adminAct('payments', p.id, { status: 'Success' }, { title: 'Payment cleared', sub: `${p.txn} · ${inr(p.amount)}` })
                        }
                      >
                        {p.status === 'Failed' ? 'Retry' : 'Force clear'}
                      </Btn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ DISPUTES ═══════════════════════════════════════════════════ */}
        {tab === 'disputes' && (
          <div className="step-body">
            <SectionHead title="Dispute management" accent={`${disputes.filter((d) => d.status !== 'Resolved').length} open`} rule />
            <div className="col gap-10 stagger">
              {disputes.map((d) => (
                <div className={cx('card pad', d.status === 'Open' && 'yellow-edge')} key={d.id} style={{ opacity: d.status === 'Resolved' ? 0.72 : 1 }}>
                  <div className="row gap-10">
                    <span className={cx('li', d.priority === 'High' ? 'red' : d.priority === 'Medium' ? 'gold' : '')}>
                      <Icon name="scale" />
                    </span>
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="h-head truncate" style={{ fontSize: 13 }}>{d.ref} · {d.type}</b>
                      <span className="tiny faint truncate">@{d.user} vs {d.event} · opened {d.age} ago</span>
                    </div>
                    <Badge tone={toneFor(d.status)}>{d.status}</Badge>
                  </div>
                  <div className="row gap-8" style={{ marginTop: 11 }}>
                    <div className="meta-cell grow"><u>Amount</u><b className={d.amount ? 'yellow' : ''}>{d.amount ? inr(d.amount) : 'Non-monetary'}</b></div>
                    <div className="meta-cell grow"><u>Priority</u><b className={d.priority === 'High' ? 'red' : d.priority === 'Medium' ? 'yellow' : 'green'}>{d.priority}</b></div>
                    <div className="meta-cell grow"><u>SLA</u><b className={d.age.includes('d') ? 'red' : 'green'}>{d.age.includes('d') ? 'Breached' : 'On time'}</b></div>
                  </div>
                  {d.status !== 'Resolved' && (
                    <div className="row gap-8" style={{ marginTop: 11 }}>
                      <Btn size="xs" variant="ghost" className="grow" icon="eye" onClick={() => toast('Case file', `Evidence from @${d.user}: 3 screenshots, lobby recording`, 'info')}>
                        Evidence
                      </Btn>
                      <Btn size="xs" variant="outline" className="grow" icon="close" onClick={() => resolveDispute(d, 'Claim rejected')}>
                        Uphold organiser
                      </Btn>
                      <Btn size="xs" variant="success" className="grow" icon="refresh" onClick={() => resolveDispute(d, 'Refunded to player')}>
                        Refund player
                      </Btn>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ REPORTS ════════════════════════════════════════════════════ */}
        {tab === 'reports' && (
          <div className="step-body">
            <SectionHead title="Tournament moderation & reports" rule />
            <div className="col gap-10 stagger">
              {reports.map((r) => (
                <div className={cx('card pad', r.severity === 'Critical' && 'yellow-edge')} key={r.id}>
                  <div className="row gap-10">
                    <Avatar name={r.target} tone={r.severity === 'Critical' ? 'red' : r.severity === 'High' ? 'yellow' : 'blue'} size="md" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="h-head truncate" style={{ fontSize: 13 }}>{r.target}</b>
                      <span className="tiny muted" style={{ display: 'block', lineHeight: 1.45, marginTop: 3 }}>{r.reason}</span>
                      <span className="tiny faint">Reported by {r.by} · {relTime(r.at)}</span>
                    </div>
                    <Badge tone={r.severity === 'Critical' ? 'red' : r.severity === 'High' ? 'yellow' : 'grey'}>{r.severity}</Badge>
                  </div>
                  {r.status !== 'Dismissed' && (
                    <div className="row gap-8" style={{ marginTop: 11 }}>
                      <Btn size="xs" variant="ghost" className="grow" icon="eye" onClick={() => toast('Replay review', 'Match replay + device telemetry opened', 'info')}>
                        Review
                      </Btn>
                      <Btn size="xs" variant="outline" className="grow" icon="alert" onClick={() => { adminAct('reports', r.id, { status: 'Warned' }, { title: 'Warning issued', sub: `${r.target} received a fair-play warning` }, 'warn') }}>
                        Warn
                      </Btn>
                      <Btn size="xs" variant="danger" className="grow" icon="ban" onClick={() => { banUser({ id: r.id, handle: r.target }); adminAct('reports', r.id, { status: 'Actioned' }, null) }}>
                        Ban
                      </Btn>
                    </div>
                  )}
                  {r.status !== 'Open' && (
                    <div className="tiny faint" style={{ marginTop: 9 }}>Status: {r.status}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ BANS ═══════════════════════════════════════════════════════ */}
        {tab === 'bans' && (
          <div className="step-body">
            <SectionHead title="Banned users" accent={`${banned.length} active`} rule />
            <div className="col gap-10 stagger">
              {banned.map((b) => (
                <div className="card pad" key={b.id} style={{ borderColor: 'rgba(255,74,94,.24)' }}>
                  <div className="row gap-10">
                    <Avatar name={b.handle} tone="red" size="md" />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="h-head truncate" style={{ fontSize: 13 }}>{b.handle}</b>
                      <span className="tiny muted truncate">{b.reason}</span>
                      <span className="tiny faint" style={{ display: 'block', marginTop: 2 }}>
                        Since {fmtDateShort(b.since)} · {b.duration} · {b.device}
                      </span>
                    </div>
                    <Badge tone="red" icon="ban">{b.duration}</Badge>
                  </div>
                  <div className="row gap-8" style={{ marginTop: 11 }}>
                    <Btn size="xs" variant="ghost" className="grow" icon="history" onClick={() => toast('Ban history', `${b.handle}: 4 reports, 2 confirmed cheats`, 'info')}>
                      History
                    </Btn>
                    <Btn size="xs" variant="outline" className="grow" icon="refresh" onClick={() => unbanUser(b)}>
                      Lift ban
                    </Btn>
                  </div>
                </div>
              ))}
              {banned.length === 0 && <EmptyState icon="shieldCheck" title="No active bans" body="Nothing here is a good thing." />}
            </div>
          </div>
        )}
        <div style={{ height: 10 }} />
      </div>

      {sheet?.type === 'adminTools' && (
        <Sheet title="Admin tools" subtitle="Trust & safety toolkit" icon="shield" onClose={closeSheet}>
          {[
            { i: 'chart', l: 'Platform reports', s: 'GMV, fill rate, dispute ratio, churn', fn: () => toast('Report generated', 'Weekly PDF emailed to admin@wargrid.gg', 'success') },
            { i: 'money', l: 'Payment monitoring', s: 'Gateway health · failure rate 0.8%', fn: () => setTab('payments') },
            { i: 'gavel', l: 'Escalation matrix', s: 'Who handles what, and in how long', fn: () => toast('Escalation matrix', 'L1 6h · L2 24h · L3 legal review', 'info') },
            { i: 'ban', l: 'Device fingerprint block', s: 'Block a device across all accounts', fn: () => toast('Device blocked', 'Fingerprint hash added to blacklist', 'warn') },
            { i: 'refresh', l: 'Escrow reconciliation', s: 'Last run 12 minutes ago · balanced', fn: () => toast('Reconciliation clean', '₹42,18,400 matched across gateways', 'success') },
            { i: 'send', l: 'Broadcast to all users', s: 'Emergency notices & maintenance', fn: () => toast('Broadcast queued', 'Sending to 1,84,320 users', 'info') },
          ].map((r) => (
            <button className="list-row tap" key={r.l} onClick={() => { r.fn(); closeSheet() }}>
              <span className={cx('li', r.l.includes('block') && 'red')}>
                <Icon name={r.i} />
              </span>
              <span className="grow" style={{ textAlign: 'left' }}>
                <b className="truncate">{r.l}</b>
                <span className="truncate">{r.s}</span>
              </span>
              <Icon name="chevronRight" className="faint chev" />
            </button>
          ))}
        </Sheet>
      )}
    </>
  )
}
