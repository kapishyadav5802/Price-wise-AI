/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Team management
   Create teams · add/remove players · set captain · save BGMI IDs ·
   invite teammates · manage multiple squads
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useState } from 'react'
import { Icon } from '../icons'
import { Art, ArtPicker, Avatar, Badge, Btn, EmptyState, Field, Input, ScreenHeader, SectionHead, Select, Sheet, StatTile } from '../ui'
import { useWG } from '../store'
import { MODES } from '../data'
import { cx, uid } from '../utils'

export default function Teams({ create = false }) {
  const { teams, freeAgents, me, back, navigate, openSheet, closeSheet, sheet, createTeam, addMember, removeMember, setCaptain, inviteTeammate, deleteTeam, toast, notify } = useWG()
  const [activeId, setActiveId] = useState(teams[0]?.id)
  const [form, setForm] = useState({ name: '', tag: '', mode: 'Squad', region: me.region, art: 'art-1' })
  const [playerForm, setPlayerForm] = useState({ name: '', bgmiId: '', role: 'Assault' })
  const [formErr, setFormErr] = useState('')

  useEffect(() => {
    if (create) openSheet({ type: 'createTeam' })
    if (!teams.find((t) => t.id === activeId)) setActiveId(teams[0]?.id)
  }, [teams.length]) // eslint-disable-line

  const team = teams.find((t) => t.id === activeId) || teams[0]
  const sizeOf = (t) => (t.mode === 'Solo' ? 1 : t.mode === 'Duo' ? 2 : 4)

  return (
    <>
      <ScreenHeader
        title="My squads"
        subtitle={`${teams.length} team${teams.length === 1 ? '' : 's'} · ${teams.reduce((n, t) => n + t.members.length, 0)} players saved`}
        onBack={back}
        right={
          <button className="icon-btn" onClick={() => openSheet({ type: 'createTeam' })} aria-label="create team" style={{ borderColor: 'rgba(232,255,58,.4)', color: 'var(--yellow)' }}>
            <Icon name="plus" />
          </button>
        }
      />

      <div className="page">
        <div className="stat-grid three" style={{ marginBottom: 14 }}>
          <StatTile label="Squads" value={teams.length} sub="active rosters" icon="users" />
          <StatTile label="Players" value={teams.reduce((n, t) => n + t.members.length, 0)} sub="BGMI IDs saved" tone="green" icon="shieldCheck" />
          <StatTile label="Best rank" value={`#${Math.min(...teams.map((t) => t.rank), 999)}`} sub="global team ladder" tone="gold" icon="crown" />
        </div>

        {teams.length === 0 ? (
          <EmptyState icon="users" title="No squads yet" body="Create your first team to book scrims and tournaments in one tap." action="Create team" onAction={() => openSheet({ type: 'createTeam' })} />
        ) : (
          <>
            {/* squad switcher */}
            <div className="chip-scroll edge" style={{ marginBottom: 14 }}>
              {teams.map((t) => (
                <button key={t.id} className={cx('chip', team?.id === t.id && 'active')} onClick={() => setActiveId(t.id)}>
                  <Icon name="users" size={12} /> {t.name}
                </button>
              ))}
              <button className="chip" onClick={() => openSheet({ type: 'createTeam' })}>
                <Icon name="plus" size={12} /> New
              </button>
            </div>

            {team && (
              <div className="team-card" key={team.id}>
                <Art variant={team.art} className="team-banner">
                  <div style={{ position: 'relative', zIndex: 6, display: 'flex', alignItems: 'center', gap: 11 }}>
                    <Avatar name={team.name} tone="yellow" size="md" ring />
                    <div className="grow" style={{ minWidth: 0 }}>
                      <b className="h-head truncate" style={{ fontSize: 15, textShadow: '0 2px 12px rgba(0,0,0,.8)' }}>{team.name}</b>
                      <div className="row gap-6" style={{ marginTop: 4 }}>
                        <span className="team-tag">{team.tag}</span>
                        <span className="mini-tag" style={{ background: 'rgba(4,6,12,.5)' }}>{team.mode}</span>
                        <span className="mini-tag" style={{ background: 'rgba(4,6,12,.5)' }}>#{team.rank}</span>
                      </div>
                    </div>
                  </div>
                </Art>

                <div className="team-body">
                  <div className="row-between" style={{ marginBottom: 10 }}>
                    <span className="kicker">Roster · {team.members.length}/{sizeOf(team)}</span>
                    <span className="tiny faint">{team.region} · created {team.created}</span>
                  </div>

                  {Array.from({ length: sizeOf(team) }).map((_, i) => {
                    const m = team.members[i]
                    if (!m)
                      return (
                        <div className="roster-row empty" key={i}>
                          <span className="slot-n">{i + 1}</span>
                          <div className="who grow">
                            <b style={{ color: 'var(--faint)' }}>Empty slot</b>
                            <span>Add a player to complete the roster</span>
                          </div>
                          <Btn size="xs" variant="outline" icon="plus" onClick={() => openSheet({ type: 'addPlayer' })}>
                            Add
                          </Btn>
                        </div>
                      )
                    return (
                      <div className="member-row" key={m.id}>
                        <Avatar name={m.name} tone={m.captain ? 'yellow' : 'blue'} size="md" />
                        <div className="grow" style={{ minWidth: 0 }}>
                          <b className="truncate" style={{ fontSize: 12.8 }}>
                            {m.name} {m.me && <Badge tone="blue" style={{ marginLeft: 4 }}>YOU</Badge>}
                          </b>
                          <span className="truncate" style={{ fontSize: 10.5, fontFamily: 'var(--font-head)', letterSpacing: '.06em', color: 'var(--faint)' }}>
                            ID {m.bgmiId} · {m.role} · {m.tier} · K/D {m.kd}
                          </span>
                          <div className="row gap-6" style={{ marginTop: 6 }}>
                            {m.captain && <span className="captain-badge">Captain</span>}
                            {!m.captain && (
                              <button className="copy-btn" style={{ marginLeft: 0 }} onClick={() => setCaptain(team.id, m.id)}>
                                Make captain
                              </button>
                            )}
                            {!m.me && (
                              <button className="copy-btn" style={{ marginLeft: 0, color: '#ff8b98' }} onClick={() => removeMember(team.id, m.id)}>
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  <div className="row gap-8" style={{ marginTop: 13 }}>
                    <Btn size="sm" variant="primary" className="grow" icon="plus" onClick={() => openSheet({ type: 'addPlayer' })}>
                      Add player
                    </Btn>
                    <Btn size="sm" variant="outline" className="grow" icon="send" onClick={() => openSheet({ type: 'invite' })}>
                      Invite
                    </Btn>
                  </div>
                  <div className="row gap-8" style={{ marginTop: 8 }}>
                    <Btn size="xs" variant="ghost" className="grow" icon="crosshair" onClick={() => navigate('scrims')}>
                      Book a scrim
                    </Btn>
                    <Btn size="xs" variant="ghost" className="grow" icon="trophy" onClick={() => navigate('tournaments')}>
                      Enter tournament
                    </Btn>
                    <Btn size="xs" variant="ghost" icon="trash" onClick={() => openSheet({ type: 'deleteTeam' })} aria-label="delete team" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <section className="section">
          <SectionHead title="Team playbook" rule />
          <div className="card pad">
            {[
              { icon: 'shieldCheck', t: 'Verified BGMI IDs', s: 'IDs are checked against the lobby before every match — no smurfs, no disputes.' },
              { icon: 'crown', t: 'Captain controls bookings', s: 'Only the captain can confirm a roster, change players or raise a dispute.' },
              { icon: 'users', t: 'Multi-squad support', s: 'Keep a Duo and a Squad roster and switch instantly at checkout.' },
            ].map((f) => (
              <div className="rule-item" key={f.t}>
                <span className="n"><Icon name={f.icon} size={12} /></span>
                <span>
                  <b className="h-head" style={{ fontSize: 12.5, display: 'block' }}>{f.t}</b>
                  <span className="tiny muted">{f.s}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
        <div style={{ height: 8 }} />
      </div>

      {/* ── create team ──────────────────────────────────────────────────── */}
      {sheet?.type === 'createTeam' && (
        <Sheet
          title="Create a team"
          subtitle="Squad details & banner"
          icon="users"
          onClose={closeSheet}
          footer={
            <>
              <Btn variant="ghost" onClick={closeSheet}>Cancel</Btn>
              <Btn
                variant="primary"
                icon="check"
                onClick={() => {
                  if (!form.name.trim()) return setFormErr('Team name is required.')
                  if (form.name.trim().length < 3) return setFormErr('Use at least 3 characters.')
                  if (!/^[A-Za-z0-9]{2,5}$/.test(form.tag)) return setFormErr('Tag must be 2–5 letters or numbers.')
                  const t = createTeam(form)
                  setFormErr('')
                  setForm({ name: '', tag: '', mode: 'Squad', region: me.region, art: 'art-1' })
                  setActiveId(t.id)
                  closeSheet()
                }}
              >
                Create team
              </Btn>
            </>
          }
        >
          <Field label="Team name" error={formErr && formErr.includes('name') ? formErr : ''}>
            <Input value={form.name} placeholder="e.g. Phantom Squad" onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="field-row">
            <Field label="Team tag" error={formErr && formErr.includes('Tag') ? formErr : ''}>
              <Input value={form.tag} maxLength={5} placeholder="PHNT" onChange={(e) => setForm({ ...form, tag: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Format">
              <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                {MODES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Region" hint="Used to match you with nearby lobbies.">
            <Input value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          </Field>
          <Field label="Banner art">
            <ArtPicker value={form.art} onChange={(art) => setForm({ ...form, art })} />
          </Field>
          <div className="card pad" style={{ marginTop: 4 }}>
            <div className="kicker" style={{ marginBottom: 8 }}>Preview</div>
            <div className="row gap-10">
              <Avatar name={form.name || 'New Team'} tone="yellow" size="md" />
              <div className="grow">
                <b className="h-head" style={{ fontSize: 13.5 }}>{form.name || 'Your team name'}</b>
                <div className="row gap-6" style={{ marginTop: 4 }}>
                  <span className="team-tag">{form.tag || 'TAG'}</span>
                  <span className="mini-tag">{form.mode}</span>
                </div>
              </div>
            </div>
          </div>
        </Sheet>
      )}

      {/* ── add player ──────────────────────────────────────────────────── */}
      {sheet?.type === 'addPlayer' && team && (
        <Sheet
          title="Add player"
          subtitle={`${team.name} · ${team.members.length}/${sizeOf(team)} filled`}
          icon="plus"
          onClose={closeSheet}
          footer={
            <>
              <Btn variant="ghost" onClick={closeSheet}>Cancel</Btn>
              <Btn
                variant="primary"
                icon="check"
                onClick={() => {
                  if (!playerForm.name.trim()) return toast('Name required', 'Enter the in-game name', 'error')
                  if (!/^\d{9,12}$/.test(playerForm.bgmiId)) return toast('Invalid BGMI ID', 'Use the 9–12 digit numeric ID', 'error')
                  if (team.members.length >= sizeOf(team)) return toast('Roster full', `${team.mode} teams hold ${sizeOf(team)} players`, 'warn')
                  addMember(team.id, { id: uid('p'), ...playerForm, captain: false, kd: 3.2, tier: 'Ace' })
                  setPlayerForm({ name: '', bgmiId: '', role: 'Assault' })
                  closeSheet()
                }}
              >
                Add to roster
              </Btn>
            </>
          }
        >
          <Field label="In-game name">
            <Input value={playerForm.name} placeholder='e.g. Rohan "RaptorX"' onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })} />
          </Field>
          <Field label="BGMI player ID" hint="Numeric ID from BGMI profile → Inventory → Stats.">
            <Input value={playerForm.bgmiId} inputMode="numeric" placeholder="51882043771" onChange={(e) => setPlayerForm({ ...playerForm, bgmiId: e.target.value.replace(/\D/g, '').slice(0, 12) })} />
          </Field>
          <Field label="Role">
            <Select value={playerForm.role} onChange={(e) => setPlayerForm({ ...playerForm, role: e.target.value })}>
              {['IGL', 'Assault', 'Sniper', 'Support', 'Rusher'].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          </Field>
          {freeAgents.length > 0 && (
            <>
              <div className="divider" />
              <div className="kicker" style={{ marginBottom: 9 }}>Or pick from WarGrid contacts</div>
              {freeAgents.map((a) => (
                <div className="member-row" key={a.id}>
                  <Avatar name={a.name} tone="violet" size="sm" />
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate" style={{ fontSize: 12 }}>{a.name}</b>
                    <span className="truncate" style={{ fontSize: 10 }}>{a.role} · {a.tier} · K/D {a.kd}</span>
                  </div>
                  <Btn size="xs" variant="outline" icon="plus" onClick={() => setPlayerForm({ name: a.name, bgmiId: a.bgmiId, role: a.role })}>
                    Use
                  </Btn>
                </div>
              ))}
            </>
          )}
        </Sheet>
      )}

      {/* ── invite ──────────────────────────────────────────────────────── */}
      {sheet?.type === 'invite' && team && (
        <Sheet title="Invite teammates" subtitle={`${team.name} · ${sizeOf(team) - team.members.length} slots open`} icon="send" onClose={closeSheet}>
          {freeAgents.length === 0 ? (
            <EmptyState icon="send" title="No pending contacts" body="Share your invite link to bring new players into the squad." action="Copy invite link" onAction={() => toast('Invite link copied', 'wargrid.gg/join/' + team.tag, 'info')} />
          ) : (
            freeAgents.map((a) => (
              <div className="member-row" key={a.id}>
                <Avatar name={a.name} tone="cyan" size="md" />
                <div className="grow" style={{ minWidth: 0 }}>
                  <b className="truncate" style={{ fontSize: 12.5 }}>{a.name}</b>
                  <span className="truncate" style={{ fontSize: 10.5 }}>{a.role} · {a.tier} · K/D {a.kd} · ID {a.bgmiId}</span>
                </div>
                <Btn size="xs" variant="primary" icon="send" onClick={() => { inviteTeammate(team.id, a); closeSheet() }}>
                  Invite
                </Btn>
              </div>
            ))
          )}
          <div className="divider" />
          <div className="row gap-8">
            <Btn variant="ghost" size="sm" className="grow" icon="copy" onClick={() => toast('Invite link copied', `wargrid.gg/join/${team.tag}`, 'info')}>
              Copy link
            </Btn>
            <Btn variant="outline" size="sm" className="grow" icon="share" onClick={() => toast('Share sheet opened', 'WhatsApp · Instagram · Discord', 'info')}>
              Share
            </Btn>
          </div>
        </Sheet>
      )}

      {/* ── delete ──────────────────────────────────────────────────────── */}
      {sheet?.type === 'deleteTeam' && team && (
        <Sheet
          title="Delete team?"
          subtitle={team.name}
          icon="alert"
          onClose={closeSheet}
          footer={
            <>
              <Btn variant="ghost" onClick={closeSheet}>Keep</Btn>
              <Btn variant="danger" icon="trash" onClick={() => { deleteTeam(team.id); closeSheet() }}>
                Delete team
              </Btn>
            </>
          }
        >
          <p className="small muted" style={{ lineHeight: 1.6 }}>
            Deleting {team.name} removes {team.members.length} saved players and cancels any pending registrations made with this roster. Booked matches stay in My Matches until they finish.
          </p>
        </Sheet>
      )}
    </>
  )
}
