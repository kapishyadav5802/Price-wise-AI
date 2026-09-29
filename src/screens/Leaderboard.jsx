/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Leaderboard
   Player & team rankings · kills · points · wins · earnings · matches played
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon } from '../icons'
import { Avatar, Badge, Btn, Chip, EmptyState, Progress, ScreenHeader, SectionHead, Segmented, StatTile, Tabs } from '../ui'
import { useWG } from '../store'
import { cx, inr, inrShort } from '../utils'

const PERIODS = [
  { id: 'all', label: 'All time' },
  { id: 'season', label: 'Season 4' },
  { id: 'week', label: 'This week' },
]

const scale = { all: 1, season: 0.42, week: 0.11 }

export default function Leaderboard() {
  const { lbPlayers, lbTeams, back, navigate, me, bookings } = useWG()
  const [board, setBoard] = useState('players')
  const [period, setPeriod] = useState('all')
  const [metric, setMetric] = useState('points')
  const [q, setQ] = useState('')

  const k = scale[period]

  const players = useMemo(() => {
    const rows = lbPlayers
      .map((p) => ({
        ...p,
        kills: Math.round(p.kills * k),
        points: Math.round(p.points * k),
        wins: Math.round(p.wins * k),
        earnings: Math.round(p.earnings * k),
        matches: Math.round(p.matches * k),
      }))
      .filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.team.toLowerCase().includes(q.toLowerCase()))
    return rows.sort((a, b) => b[metric] - a[metric])
  }, [lbPlayers, k, metric, q])

  const teams = useMemo(() => {
    const rows = lbTeams
      .map((t) => ({
        ...t,
        kills: Math.round(t.kills * k),
        points: Math.round(t.points * k),
        wins: Math.round(t.wins * k),
        earnings: Math.round(t.earnings * k),
        matches: Math.round(t.matches * k),
      }))
      .filter((t) => !q || t.name.toLowerCase().includes(q.toLowerCase()))
    return rows.sort((a, b) => b[metric] - a[metric])
  }, [lbTeams, k, metric, q])

  const rows = board === 'players' ? players : teams
  const meRow = board === 'players' ? players.find((p) => p.me) : teams.find((t) => t.mine)
  const myRank = meRow ? rows.indexOf(meRow) + 1 : null
  const ahead = myRank && myRank > 1 ? rows[myRank - 2] : null
  const gap = ahead ? ahead[metric] - meRow[metric] : 0

  const podium = rows.slice(0, 3)
  const metricLabel = { points: 'Points', kills: 'Kills', wins: 'Wins', earnings: 'Earnings', matches: 'Matches' }[metric]

  return (
    <>
      <ScreenHeader
        title="Leaderboard"
        subtitle={`${period === 'all' ? 'All time' : period === 'season' ? 'Season 4' : 'This week'} · India region`}
        onBack={back}
        right={
          <button className="icon-btn" onClick={() => navigate('profile')} aria-label="profile">
            <Icon name="user" />
          </button>
        }
      />

      <div className="page">
        <Segmented value={board} onChange={setBoard} options={[{ id: 'players', label: 'Players' }, { id: 'teams', label: 'Teams' }]} />

        <div className="row gap-8" style={{ marginTop: 12 }}>
          <div className="chip-scroll" style={{ margin: 0, padding: 0 }}>
            {PERIODS.map((p) => (
              <Chip key={p.id} active={period === p.id} onClick={() => setPeriod(p.id)}>
                {p.label}
              </Chip>
            ))}
          </div>
        </div>

        <div className="row gap-8" style={{ marginTop: 10 }}>
          <div className="chip-scroll" style={{ margin: 0, padding: 0 }}>
            {[
              { id: 'points', label: 'Points', icon: 'star' },
              { id: 'kills', label: 'Kills', icon: 'crosshair' },
              { id: 'wins', label: 'Wins', icon: 'crown' },
              { id: 'earnings', label: 'Earnings', icon: 'rupee' },
              { id: 'matches', label: 'Matches', icon: 'ticket' },
            ].map((m) => (
              <Chip key={m.id} active={metric === m.id} yellow={metric === m.id} onClick={() => setMetric(m.id)}>
                <Icon name={m.icon} size={12} /> {m.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* ── podium ───────────────────────────────────────────────────── */}
        {podium.length === 3 && (
          <div className="podium">
            {[podium[1], podium[0], podium[2]].map((p, i) => {
              const pos = i === 1 ? 1 : i === 0 ? 2 : 3
              return (
                <div key={p.id} className={cx('pod', pos === 1 && 'gold', pos === 2 && 'silver', pos === 3 && 'bronze')}>
                  <span className="rank">#{pos}</span>
                  {pos === 1 && <Icon name="crown" size={17} style={{ color: 'var(--yellow)', margin: '0 auto 5px', filter: 'drop-shadow(0 0 10px rgba(232,255,58,.7))' }} />}
                  <Avatar name={p.name} tone={pos === 1 ? 'yellow' : pos === 2 ? 'cyan' : 'violet'} size={pos === 1 ? 'lg' : 'md'} />
                  <b>{board === 'players' ? p.name.split('"')[1] || p.name : p.name}</b>
                  <u>{metric === 'earnings' ? inrShort(p[metric]) : p[metric].toLocaleString('en-IN')}</u>
                  <span>{metricLabel}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* ── search ───────────────────────────────────────────────────── */}
        <div className="searchbar" style={{ height: 42, marginBottom: 12 }}>
          <Icon name="search" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${board}…`} />
          {q && <button className="clear" onClick={() => setQ('')}>✕</button>}
        </div>

        {/* ── rows ─────────────────────────────────────────────────────── */}
        {rows.length === 0 ? (
          <EmptyState icon="chart" title="No ranks matched" body="Try clearing the search." action="Clear" onAction={() => setQ('')} />
        ) : (
          <div className="stagger">
            {rows.map((p, i) => {
              const rank = i + 1
              const isMe = board === 'players' ? p.me : p.mine
              return (
                <div key={p.id} className={cx('lb-row', isMe && 'me', rank === 1 && 'top1', rank === 2 && 'top2', rank === 3 && 'top3')} onClick={() => isMe && navigate('profile')}>
                  <span className="rk">{rank <= 3 ? <Icon name={rank === 1 ? 'trophy' : 'medal'} size={15} /> : rank}</span>
                  <Avatar name={p.name} tone={rank === 1 ? 'yellow' : rank === 2 ? 'cyan' : rank === 3 ? 'violet' : 'blue'} size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 12.5, fontFamily: 'var(--font-head)', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span className="truncate">{board === 'players' ? p.name : p.name}</span>
                      {isMe && <span className="captain-badge">YOU</span>}
                    </b>
                    <span className="truncate" style={{ fontSize: 10.5, color: 'var(--faint)' }}>
                      {board === 'players' ? `${p.team} · K/D ${p.kd}` : `${p.tag} · ${p.wins} wins`}
                    </span>
                  </div>
                  <div className="lb-stats">
                    {board === 'players' && (
                      <div className="lb-stat">
                        <u>Kills</u>
                        <b>{p.kills.toLocaleString('en-IN')}</b>
                      </div>
                    )}
                    <div className="lb-stat">
                      <u>{metricLabel}</u>
                      <b className="gold">{metric === 'earnings' ? inrShort(p[metric]) : p[metric].toLocaleString('en-IN')}</b>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── my standing ──────────────────────────────────────────────── */}
        {meRow && (
          <section className="section">
            <SectionHead title="Your standing" rule />
            <div className="card pad blue-edge">
              <div className="row gap-12">
                <Avatar name={meRow.name} tone="yellow" size="lg" ring />
                <div className="grow">
                  <div className="kicker blue">Global rank</div>
                  <b className="display" style={{ fontSize: 26 }}>#{myRank}</b>
                  <div className="tiny muted" style={{ marginTop: 2 }}>
                    {meRow.name} · {board === 'players' ? meRow.team : meRow.tag}
                  </div>
                </div>
              </div>
              <div className="stat-grid" style={{ marginTop: 13 }}>
                <StatTile label="Points" value={meRow.points} icon="star" />
                <StatTile label="Kills" value={meRow.kills} icon="crosshair" tone="gold" />
                <StatTile label="Wins" value={meRow.wins} icon="crown" tone="green" />
                <StatTile label="Earnings" value={inr(meRow.earnings)} icon="rupee" />
              </div>
              {ahead && (
                <>
                  <div className="divider" />
                  <div className="row-between" style={{ marginBottom: 7 }}>
                    <span className="tiny muted">
                      {gap.toLocaleString('en-IN')} {metricLabel.toLowerCase()} behind #{myRank - 1} {ahead.name.split('"')[1] || ahead.name}
                    </span>
                    <span className="tiny yellow">{Math.round((meRow[metric] / ahead[metric]) * 100)}%</span>
                  </div>
                  <Progress value={meRow[metric]} max={ahead[metric]} />
                  <div className="tiny faint" style={{ marginTop: 9 }}>
                    Win {Math.ceil(gap / (metric === 'kills' ? 14 : metric === 'points' ? 51 : 4))} more matches to overtake them.
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── season rewards ───────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Season rewards" rule />
          <div className="card pad yellow-edge">
            {[
              { r: '#1 – #3', t: '₹25,000 + WarGrid Pro invite', i: 'crown' },
              { r: '#4 – #25', t: '₹5,000 + verified player badge', i: 'medal' },
              { r: '#26 – #100', t: 'Free entry to 3 paid tournaments', i: 'ticket' },
              { r: 'Top 10 teams', t: 'Scouted for Zone Zero Invitational', i: 'users' },
            ].map((x) => (
              <div className="rule-item" key={x.r}>
                <span className="n"><Icon name={x.i} size={12} /></span>
                <span>
                  <b className="h-head" style={{ fontSize: 12 }}>{x.r}</b>
                  <span className="tiny muted" style={{ display: 'block' }}>{x.t}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
        <div style={{ height: 8 }} />
      </div>
    </>
  )
}
