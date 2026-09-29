/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — store
   One context that owns: routing, the mock backend state, toasts, sheets and
   the live-match simulation. Every screen reads/writes through useWG().
   ══════════════════════════════════════════════════════════════════════════ */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import * as seed from './data'
import { uid, pad2, MIN, HOUR, DAY, pick } from './utils'

const Ctx = createContext(null)
export const useWG = () => useContext(Ctx)

const initialLive = () => ({
  eventId: 't0',
  name: 'WarGrid Weekly Wars #37',
  match: 'Match 3 of 5',
  map: 'Sanhok',
  phase: 'Zone 4',
  alive: 41,
  teamsAlive: 18,
  kills: 214,
  viewers: 12480,
  zoneTimer: 4 * MIN + 12000,
  startedAt: Date.now() - 26 * MIN,
  feed: [
    { killer: 'SN1PER_KING', victim: 'xRAZOR', weapon: 'Kar98k', zone: 'Bootcamp' },
    { killer: 'GhostRifle', victim: 'NinjaOP', weapon: 'M416 + 6x', zone: 'Paradise' },
    { killer: 'ZoneGod', victim: 'MrFrost', weapon: 'AKM', zone: 'Ruins' },
  ],
})

const KNOWN_SCREENS = [
  'home',
  'scrims',
  'tournaments',
  'matches',
  'profile',
  'event',
  'booking',
  'match',
  'teams',
  'leaderboard',
  'wallet',
  'notifications',
  'organizer',
  'admin',
]

const TAB_SCREENS = ['home', 'scrims', 'tournaments', 'matches', 'profile']

/** read the initial route from the URL hash so battles are shareable links */
function initialStack() {
  if (typeof window === 'undefined') return [{ screen: 'home', params: {} }]
  const [screen, id] = String(window.location.hash || '').replace(/^#\/?/, '').split('/')
  if (screen && KNOWN_SCREENS.includes(screen)) {
    return [{ screen, params: id ? { id: decodeURIComponent(id) } : {}, key: 'init' }]
  }
  return [{ screen: 'home', params: {} }]
}

export function WarGridProvider({ children }) {
  /* ── clock (drives every countdown in the app) ────────────────────────── */
  const [clock, setClock] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  /* ── routing (deep-linkable via #/screen/id) ─────────────────────────── */
  const [stack, setStack] = useState(() => initialStack())
  const [dir, setDir] = useState('push')
  const [tab, setTab] = useState('home')

  const navigate = useCallback((screen, params = {}) => {
    setDir('push')
    setStack((s) => [...s, { screen, params, key: uid('r') }])
  }, [])

  const back = useCallback(() => {
    setDir('pop')
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  const goTab = useCallback((nextTab) => {
    setDir('push')
    setTab(nextTab)
    setStack([{ screen: nextTab, params: {} }])
  }, [])

  const resetTo = useCallback((screen, params = {}) => {
    setDir('push')
    setStack([{ screen, params }])
  }, [])

  const route = stack[stack.length - 1]

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = `#/${route.screen}${route.params?.id ? '/' + route.params.id : ''}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [route])

  // deep links + browser back/forward: #/event/t1, #/booking/t1, #/matches …
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onHash = () => {
      const [screen, id] = String(window.location.hash || '').replace(/^#\/?/, '').split('/')
      if (!screen || !KNOWN_SCREENS.includes(screen)) return
      setDir('push')
      if (TAB_SCREENS.includes(screen)) setTab(screen)
      setStack([{ screen, params: id ? { id: decodeURIComponent(id) } : {}, key: uid('r') }])
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  /* ── mock backend ─────────────────────────────────────────────────────── */
  const [me] = useState(seed.ME)
  // tournaments default to releasing room credentials 30 min before the first match
  const [tournaments, setTournaments] = useState(() =>
    seed.TOURNAMENTS.map((t) => ({
      ...t,
      releaseAt: t.releaseAt || new Date(new Date(t.startsAt).getTime() - 30 * MIN).toISOString(),
    }))
  )
  const [scrims, setScrims] = useState(seed.SCRIMS)
  const [bookings, setBookings] = useState(seed.BOOKINGS)
  const [teams, setTeams] = useState(seed.TEAMS)
  const [wallet, setWallet] = useState(seed.WALLET)
  const [notifs, setNotifs] = useState(seed.NOTIFICATIONS)
  const [lbPlayers, setLbPlayers] = useState(seed.LB_PLAYERS)
  const [lbTeams, setLbTeams] = useState(seed.LB_TEAMS)
  const [orgEvents, setOrgEvents] = useState(seed.ORG_EVENTS)
  const [orgParticipants, setOrgParticipants] = useState(seed.ORG_PARTICIPANTS)
  const [orgEarnings, setOrgEarnings] = useState(seed.ORG_EARNINGS)
  const [freeAgents, setFreeAgents] = useState(seed.FREE_AGENTS)
  const [admin, setAdmin] = useState({
    stats: seed.ADMIN_STATS,
    users: seed.ADMIN_USERS,
    verifications: seed.ADMIN_VERIFICATIONS,
    approvals: seed.ADMIN_APPROVALS,
    payments: seed.ADMIN_PAYMENTS,
    disputes: seed.ADMIN_DISPUTES,
    reports: seed.ADMIN_REPORTS,
    banned: seed.ADMIN_BANNED,
  })

  /* ── toasts ───────────────────────────────────────────────────────────── */
  const [toasts, setToasts] = useState([])
  const timers = useRef({})
  const toast = useCallback((title, sub, tone = 'success') => {
    const id = uid('t')
    setToasts((ts) => [...ts.slice(-2), { id, title, sub, tone }])
    timers.current[id] = setTimeout(() => {
      setToasts((ts) => ts.filter((t) => t.id !== id))
    }, 3200)
  }, [])
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

  /* ── sheets ───────────────────────────────────────────────────────────── */
  const [sheet, setSheet] = useState(null)
  const openSheet = useCallback((s) => setSheet(s), [])
  const closeSheet = useCallback(() => setSheet(null), [])

  /* Android hardware back: dismiss an open sheet first, then pop the route */
  useEffect(() => {
    const onHardwareBack = () => {
      if (sheet) closeSheet()
      else back()
    }
    window.addEventListener('wargrid-back', onHardwareBack)
    return () => window.removeEventListener('wargrid-back', onHardwareBack)
  }, [sheet, back, closeSheet])

  /* ── live match simulation ────────────────────────────────────────────── */
  const [live, setLive] = useState(initialLive)
  useEffect(() => {
    const t = setInterval(() => {
      setLive((l) => {
        const alive = Math.max(3, l.alive - Math.floor(Math.random() * 3))
        const kill = pick(seed.LIVE_FEED_POOL)
        return {
          ...l,
          alive,
          teamsAlive: Math.max(2, Math.ceil(alive / 2.6)),
          kills: l.kills + 1 + Math.floor(Math.random() * 2),
          viewers: l.viewers + Math.floor(Math.random() * 240) - 90,
          zoneTimer: l.zoneTimer > 0 ? l.zoneTimer - 4000 : 5 * MIN,
          feed: [{ ...kill }, ...l.feed].slice(0, 3),
        }
      })
    }, 4200)
    return () => clearInterval(t)
  }, [])

  /* ── derived ──────────────────────────────────────────────────────────── */
  const allRaw = useMemo(() => [...tournaments, ...scrims], [tournaments, scrims])
  const getEvent = useCallback((id) => allRaw.find((e) => e.id === id), [allRaw])
  // events an organiser has submitted but admin hasn't approved stay out of discovery
  const visibleTournaments = useMemo(() => tournaments.filter((t) => !t.pendingApproval), [tournaments])
  const allEvents = useMemo(() => [...visibleTournaments, ...scrims], [visibleTournaments, scrims])

  const notify = useCallback((n) => {
    setNotifs((ns) => [{ id: uid('n'), at: new Date().toISOString(), read: false, ...n }, ...ns])
  }, [])

  const pushTxn = useCallback((tx) => {
    setWallet((w) => ({ ...w, transactions: [{ id: uid('tx'), at: new Date().toISOString(), ...tx }, ...w.transactions] }))
  }, [])

  /* ══ ACTIONS ══════════════════════════════════════════════════════════ */

  /** complete a booking (called at the end of the booking flow) */
  const bookEvent = useCallback(
    ({ event, team, players, method, useWallet }) => {
      const amount = event.entryFee || 0
      const booking = {
        id: uid('bk'),
        eventId: event.id,
        eventType: event.type,
        teamId: team?.id,
        status: amount && method === 'wallet' && wallet.balance < amount ? 'failed' : 'confirmed',
        amount,
        method,
        bookedAt: new Date().toISOString(),
        players,
        roomId: event.roomId || null,
        roomPass: event.roomPass || null,
        releaseAt: event.releaseAt || null,
        result: null,
        seatNo: event.slotsFilled + 1,
      }
      if (booking.status === 'failed') return booking

      setBookings((bs) => [booking, ...bs])
      if (amount) {
        if (useWallet || method === 'wallet') {
          setWallet((w) => ({ ...w, balance: w.balance - amount }))
          pushTxn({ kind: 'debit', type: 'Entry fee', label: `${event.name}${team ? ' · ' + team.name : ''}`, amount, method: 'Wallet' })
        } else {
          pushTxn({ kind: 'debit', type: 'Entry fee', label: `${event.name}${team ? ' · ' + team.name : ''}`, amount, method: method === 'upi' ? 'UPI' : 'Card' })
        }
      }
      // fill the slot
      if (event.type === 'tournament') {
        setTournaments((ts) =>
          ts.map((t) => (t.id === event.id ? { ...t, slotsFilled: Math.min(t.slotsTotal, t.slotsFilled + 1), registeredTeams: t.registeredTeams + 1 } : t))
        )
      } else {
        setScrims((ss) => ss.map((s) => (s.id === event.id ? { ...s, slotsFilled: Math.min(s.slotsTotal, s.slotsFilled + 1) } : s)))
      }
      notify({
        kind: 'booking',
        tone: 'blue',
        title: 'Registration confirmed',
        body: `${team?.name || 'Your squad'} is locked into ${event.name}${booking.seatNo ? ` (Seat #${booking.seatNo})` : ''}.`,
        eventId: event.id,
      })
      return booking
    },
    [notify, pushTxn, wallet.balance]
  )

  const joinWaitlist = useCallback(
    (event) => {
      const pos = (event.waitlist || 0) + 1
      const booking = {
        id: uid('bk'),
        eventId: event.id,
        eventType: event.type,
        teamId: null,
        status: 'waitlist',
        amount: 0,
        bookedAt: new Date().toISOString(),
        players: [],
        waitlistPos: pos,
        roomId: null,
        roomPass: null,
        result: null,
      }
      setBookings((bs) => [booking, ...bs])
      notify({ kind: 'booking', tone: 'gold', title: 'Added to waitlist', body: `You are #${pos} in line for ${event.name}. We'll auto-book you if a slot frees up.`, eventId: event.id })
      return booking
    },
    [notify]
  )

  const cancelBooking = useCallback(
    (id) => {
      const b = bookings.find((x) => x.id === id)
      if (!b) return
      setBookings((bs) => bs.filter((x) => x.id !== id))
      if (b.amount) {
        setWallet((w) => ({ ...w, balance: w.balance + b.amount }))
        pushTxn({ kind: 'credit', type: 'Refund', label: `Cancelled · ${getEvent(b.eventId)?.name || 'event'}`, amount: b.amount, method: 'Wallet' })
      }
      notify({ kind: 'booking', tone: 'red', title: 'Registration cancelled', body: `Your slot for ${getEvent(b.eventId)?.name || 'the event'} was released.`, eventId: b.eventId })
      toast('Slot released', b.amount ? `₹${b.amount} refunded to wallet` : 'Registration cancelled', 'warn')
    },
    [bookings, getEvent, notify, pushTxn, toast]
  )

  const addMoney = useCallback(
    (amount, method = 'UPI') => {
      setWallet((w) => ({ ...w, balance: w.balance + amount }))
      pushTxn({ kind: 'credit', type: 'Added money', label: `${method} · ${method === 'UPI' ? 'aarav@okhdfc' : 'HDFC ••••4471'}`, amount, method })
      toast(`₹${amount} added`, 'WarGrid Wallet topped up', 'success')
    },
    [pushTxn, toast]
  )

  const withdraw = useCallback(
    (amount) => {
      if (amount > wallet.balance) {
        toast('Insufficient balance', `You can withdraw up to ₹${wallet.balance}`, 'error')
        return false
      }
      setWallet((w) => ({ ...w, balance: w.balance - amount }))
      pushTxn({ kind: 'debit', type: 'Withdrawal', label: 'To HDFC ••••4471', amount, method: 'Bank' })
      setAdmin((a) => ({
        ...a,
        payments: [
          { id: uid('p'), txn: `WG-${Math.floor(990000 + Math.random() * 9999)}`, user: me.handle, event: 'Withdrawal → HDFC', amount, method: 'Bank', status: 'Processing', at: new Date().toISOString() },
          ...a.payments,
        ],
      }))
      notify({ kind: 'prize', tone: 'green', title: 'Withdrawal initiated', body: `₹${amount} is on the way to HDFC ••••4471. Usually lands in 24 hours.`, })
      toast('Withdrawal requested', `₹${amount} → HDFC ••••4471`, 'success')
      return true
    },
    [me.handle, notify, pushTxn, toast, wallet.balance]
  )

  /* ── teams ────────────────────────────────────────────────────────────── */
  const createTeam = useCallback(
    ({ name, tag, mode, region, art }) => {
      const team = {
        id: uid('team'),
        name,
        tag: tag.toUpperCase().slice(0, 5),
        mode,
        region: region || me.region,
        art: art || 'art-1',
        created: 'Today',
        rank: 900 + Math.floor(Math.random() * 99),
        rating: 4.5,
        members: [
          { id: 'p1', name: `${me.name.split(' ')[0]} "${me.handle}"`, bgmiId: me.bgmiId, role: 'IGL', captain: true, kd: me.kd, tier: me.tier, me: true },
        ],
      }
      setTeams((ts) => [team, ...ts])
      toast('Team created', `${team.name} is ready to battle`, 'success')
      notify({ kind: 'team', tone: 'blue', title: 'Team created', body: `${team.name} [${team.tag}] registered on WarGrid. Add players to start booking.` })
      return team
    },
    [me, notify, toast]
  )

  const updateTeam = useCallback((id, fn) => {
    setTeams((ts) => ts.map((t) => (t.id === id ? fn(t) : t)))
  }, [])

  const addMember = useCallback(
    (teamId, player) => {
      updateTeam(teamId, (t) => ({ ...t, members: [...t.members, { ...player, captain: false }] }))
      toast('Player added', `${player.name} joined the roster`, 'success')
    },
    [toast, updateTeam]
  )

  const removeMember = useCallback(
    (teamId, playerId) => {
      updateTeam(teamId, (t) => ({ ...t, members: t.members.filter((m) => m.id !== playerId) }))
      toast('Player removed', 'Roster updated', 'warn')
    },
    [toast, updateTeam]
  )

  const setCaptain = useCallback(
    (teamId, playerId) => {
      updateTeam(teamId, (t) => ({ ...t, members: t.members.map((m) => ({ ...m, captain: m.id === playerId })) }))
      toast('Captain updated', 'New IGL assigned for bookings', 'info')
    },
    [toast, updateTeam]
  )

  const inviteTeammate = useCallback(
    (teamId, agent) => {
      notify({ kind: 'team', tone: 'blue', title: 'Invite sent', body: `${agent.name} was invited to join your squad. They have 24h to accept.` })
      toast('Invite sent', `${agent.name} · expires in 24h`, 'info')
      setFreeAgents((fa) => fa.filter((a) => a.id !== agent.id))
      setTimeout(() => {
        addMember(teamId, agent)
        notify({ kind: 'team', tone: 'green', title: 'Invite accepted', body: `${agent.name} joined your squad as ${agent.role}.` })
      }, 6000)
    },
    [addMember, notify, toast]
  )

  const deleteTeam = useCallback(
    (teamId) => {
      setTeams((ts) => ts.filter((t) => t.id !== teamId))
      toast('Team deleted', 'Roster removed from WarGrid', 'warn')
    },
    [toast]
  )

  /* ── notifications ────────────────────────────────────────────────────── */
  const markAllRead = useCallback(() => setNotifs((ns) => ns.map((n) => ({ ...n, read: true }))), [])
  const markRead = useCallback((id) => setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))), [])
  const clearNotifs = useCallback(() => setNotifs([]), [])
  const unread = notifs.filter((n) => !n.read).length

  /* ── organizer actions ────────────────────────────────────────────────── */
  const createOrgEvent = useCallback(
    (payload) => {
      const isScrim = payload.type === 'scrim'
      const event = {
        id: uid(isScrim ? 's' : 't'),
        type: payload.type,
        name: payload.name,
        subtitle: payload.subtitle || (isScrim ? 'Custom scrim lobby' : 'New tournament'),
        art: payload.art || 'art-1',
        mode: payload.mode,
        maps: isScrim ? [payload.map] : payload.maps?.length ? payload.maps : [payload.map],
        map: payload.map,
        entryFee: Number(payload.entryFee) || 0,
        prizePool: Number(payload.prizePool) || 0,
        perKill: Number(payload.perKill) || 0,
        slotsTotal: Number(payload.slots) || 25,
        slotsFilled: 0,
        squadSize: payload.mode === 'Solo' ? 1 : payload.mode === 'Duo' ? 2 : 4,
        matches: Number(payload.matches) || 1,
        region: 'India',
        startsAt: payload.startsAt,
        endsAt: payload.endsAt || new Date(new Date(payload.startsAt).getTime() + 3 * HOUR).toISOString(),
        organizer: seed.ORGANIZER_ME,
        status: 'open',
        featured: false,
        tags: [payload.entryFee > 0 ? 'paid' : 'free', isScrim ? 'scrims' : 'tournament', payload.mode.toLowerCase()],
        description: payload.description || 'Created from the WarGrid organiser dashboard.',
        rules: payload.rules?.length ? payload.rules : ['Standard WarGrid fair-play rules apply.', 'Room ID released 20 minutes before start.'],
        prizes: payload.prizes?.length
          ? payload.prizes
          : [
              { pos: 1, label: '1st Place', amount: Math.round((payload.prizePool || 0) * 0.5) },
              { pos: 2, label: '2nd Place', amount: Math.round((payload.prizePool || 0) * 0.3) },
              { pos: 3, label: '3rd Place', amount: Math.round((payload.prizePool || 0) * 0.2) },
            ],
        schedule: payload.schedule?.length ? payload.schedule : [{ n: 'Match 1', time: '—', map: payload.map || 'Erangel', state: 'next' }],
        registeredTeams: 0,
        waitlist: 0,
        roomId: null,
        roomPass: null,
        releaseAt: payload.releaseAt || new Date(new Date(payload.startsAt).getTime() - 20 * MIN).toISOString(),
        pendingApproval: !isScrim,
      }
      if (isScrim) setScrims((ss) => [event, ...ss])
      else setTournaments((ts) => [event, ...ts])
      setOrgEvents((oe) => [
        {
          id: event.id,
          name: event.name,
          type: isScrim ? 'Scrim' : 'Tournament',
          status: isScrim ? 'Room ID locked' : 'Pending admin approval',
          slots: `0 / ${event.slotsTotal}`,
          revenue: 0,
          startsAt: event.startsAt,
          art: event.art,
        },
        ...oe,
      ])
      setAdmin((a) => ({
        ...a,
        approvals: isScrim
          ? a.approvals
          : [
              {
                id: uid('ap'),
                event: event.name,
                org: seed.ORGANIZER_ME.name,
                prize: event.prizePool,
                entry: event.entryFee,
                slots: event.slotsTotal,
                submitted: new Date().toISOString(),
                type: 'Tournament',
                risk: event.prizePool > 500000 ? 'High' : 'Low',
              },
              ...a.approvals,
            ],
      }))
      notify({
        kind: 'system',
        tone: 'gold',
        title: isScrim ? 'Scrim created' : 'Tournament submitted for approval',
        body: isScrim
          ? `${event.name} is live in the scrims feed. Release the room ID when you're ready.`
          : `${event.name} is queued for admin moderation. You'll be notified on approval.`,
      })
      toast(isScrim ? 'Scrim published' : 'Submitted for approval', event.name, 'success')
      return event
    },
    [notify, toast]
  )

  const releaseRoom = useCallback(
    (eventId, roomId, roomPass) => {
      const patch = (e) => ({ ...e, roomId, roomPass, roomReleased: true })
      setTournaments((ts) => ts.map((t) => (t.id === eventId ? patch(t) : t)))
      setScrims((ss) => ss.map((s) => (s.id === eventId ? patch(s) : s)))
      setBookings((bs) => bs.map((b) => (b.eventId === eventId ? { ...b, roomId, roomPass } : b)))
      setOrgEvents((oe) => oe.map((o) => (o.id === eventId ? { ...o, status: 'Room ID released' } : o)))
      notify({ kind: 'room', tone: 'gold', title: 'Room ID released', body: `Room ${roomId} · Pass ${roomPass} — join now, lobby closes in 10 minutes.`, eventId })
      toast('Room ID released', `${roomId} · ${roomPass}`, 'success')
    },
    [notify, toast]
  )

  const updateResults = useCallback(
    (eventId, rows) => {
      const ev = getEvent(eventId)
      setBookings((bs) =>
        bs.map((b) => {
          if (b.eventId !== eventId || b.status === 'waitlist') return b
          const mine = rows.find((r) => r.tag === teams.find((t) => t.id === b.teamId)?.tag)
          if (!mine) return { ...b, status: 'completed' }
          const earned = mine.pos === 1 ? Math.round((ev?.prizePool || 0) * 0.5) : mine.pos === 2 ? Math.round((ev?.prizePool || 0) * 0.25) : mine.pos === 3 ? Math.round((ev?.prizePool || 0) * 0.12) : 0
          return {
            ...b,
            status: 'completed',
            result: { position: mine.pos, kills: mine.kills, points: mine.points, earned, wwcd: mine.pos === 1, damage: mine.kills * 172 + 320 },
          }
        })
      )
      setScrims((ss) => ss.map((s) => (s.id === eventId ? { ...s, status: 'completed' } : s)))
      setTournaments((ts) => ts.map((t) => (t.id === eventId ? { ...t, status: 'completed' } : t)))
      setOrgEvents((oe) => oe.map((o) => (o.id === eventId ? { ...o, status: 'Results published' } : o)))
      const winner = rows[0]
      notify({
        kind: 'result',
        tone: 'blue',
        title: 'Results published',
        body: `${ev?.name || 'Event'} is complete. ${winner?.team || 'Winner'} takes #1 with ${winner?.kills || 0} kills.`,
        eventId,
      })
      const mine = bookings.find((b) => b.eventId === eventId)
      if (mine) {
        const myTeam = teams.find((t) => t.id === mine.teamId)
        const row = rows.find((r) => r.tag === myTeam?.tag)
        if (row && row.pos <= 3 && ev?.prizePool) {
          const earned = row.pos === 1 ? Math.round(ev.prizePool * 0.5) : row.pos === 2 ? Math.round(ev.prizePool * 0.25) : Math.round(ev.prizePool * 0.12)
          setWallet((w) => ({ ...w, balance: w.balance + earned, winnings: w.winnings + earned }))
          pushTxn({ kind: 'credit', type: 'Prize money', label: `${ev.name} · #${row.pos}`, amount: earned, method: 'Wallet' })
          notify({ kind: 'prize', tone: 'green', title: `₹${earned.toLocaleString('en-IN')} prize credited`, body: `#${row.pos} finish in ${ev.name} paid out to your wallet.` })
        }
      }
      toast('Results published', `${rows.length} teams updated`, 'success')
    },
    [bookings, getEvent, notify, pushTxn, teams, toast]
  )

  const toggleParticipant = useCallback((id) => {
    setOrgParticipants((ps) => ps.map((p) => (p.id === id ? { ...p, checked: !p.checked, status: !p.checked ? 'Verified' : 'Pending' } : p)))
  }, [])

  /* ── admin actions ────────────────────────────────────────────────────── */
  const adminAct = useCallback(
    (group, id, patch, msg, tone = 'success') => {
      setAdmin((a) => ({ ...a, [group]: a[group].map((r) => (r.id === id ? { ...r, ...patch } : r)) }))
      if (msg) toast(msg.title, msg.sub, tone)
    },
    [toast]
  )

  const approveEvent = useCallback(
    (row) => {
      setAdmin((a) => ({ ...a, approvals: a.approvals.filter((r) => r.id !== row.id) }))
      setTournaments((ts) => ts.map((t) => (t.name === row.event ? { ...t, pendingApproval: false } : t)))
      setOrgEvents((oe) => oe.map((o) => (o.name === row.event ? { ...o, status: 'Approved · Registrations open' } : o)))
      notify({ kind: 'system', tone: 'green', title: 'Tournament approved', body: `${row.event} cleared moderation and is now live in discovery.` })
      toast('Tournament approved', row.event, 'success')
    },
    [notify, toast]
  )

  const rejectEvent = useCallback(
    (row, reason = 'Prize pool unverifiable') => {
      setAdmin((a) => ({ ...a, approvals: a.approvals.filter((r) => r.id !== row.id) }))
      setOrgEvents((oe) => oe.map((o) => (o.name === row.event ? { ...o, status: 'Rejected by admin' } : o)))
      notify({ kind: 'system', tone: 'red', title: 'Tournament rejected', body: `${row.event} — ${reason}.` })
      toast('Submission rejected', row.event, 'error')
    },
    [notify, toast]
  )

  const verifyOrganizer = useCallback(
    (row, approved) => {
      setAdmin((a) => ({ ...a, verifications: a.verifications.filter((r) => r.id !== row.id) }))
      toast(approved ? 'Organizer verified' : 'Verification rejected', row.org, approved ? 'success' : 'error')
      notify({
        kind: 'system',
        tone: approved ? 'green' : 'red',
        title: approved ? 'Organizer verified' : 'Organizer rejected',
        body: `${row.org} ${approved ? 'now carries the verified badge across WarGrid.' : 'failed document review.'}`,
      })
    },
    [notify, toast]
  )

  const banUser = useCallback(
    (row) => {
      setAdmin((a) => ({
        ...a,
        users: a.users.map((u) => (u.id === row.id ? { ...u, status: 'Banned', tone: 'red' } : u)),
        banned: [{ id: uid('b'), handle: row.handle, reason: 'Manual admin ban', since: new Date().toISOString(), duration: 'Permanent', device: '1 device' }, ...a.banned],
      }))
      toast('User banned', `${row.handle} · device fingerprint blocked`, 'error')
    },
    [toast]
  )

  const unbanUser = useCallback(
    (row) => {
      setAdmin((a) => ({ ...a, banned: a.banned.filter((b) => b.id !== row.id) }))
      toast('Ban lifted', row.handle, 'info')
    },
    [toast]
  )

  const resolveDispute = useCallback(
    (row, verdict = 'Refunded') => {
      setAdmin((a) => ({ ...a, disputes: a.disputes.map((d) => (d.id === row.id ? { ...d, status: 'Resolved' } : d)), stats: { ...a.stats, disputes: Math.max(0, a.stats.disputes - 1) } }))
      if (row.amount) {
        pushTxn({ kind: 'credit', type: 'Refund', label: `Dispute ${row.ref} · ${verdict}`, amount: row.amount, method: 'Wallet' })
      }
      toast('Dispute resolved', `${row.ref} · ${verdict}`, 'success')
    },
    [pushTxn, toast]
  )

  /* ── value ────────────────────────────────────────────────────────────── */
  const value = {
    clock,
    route,
    dir,
    tab,
    stack,
    navigate,
    back,
    goTab,
    resetTo,
    me,
    tournaments: visibleTournaments,
    scrims,
    allEvents,
    getEvent,
    bookings,
    teams,
    freeAgents,
    wallet,
    notifs,
    unread,
    lbPlayers,
    lbTeams,
    setLbPlayers,
    setLbTeams,
    orgEvents,
    orgParticipants,
    orgEarnings,
    admin,
    live,
    setLive,
    toasts,
    toast,
    sheet,
    openSheet,
    closeSheet,
    notify,
    bookEvent,
    joinWaitlist,
    cancelBooking,
    addMoney,
    withdraw,
    createTeam,
    updateTeam,
    addMember,
    removeMember,
    setCaptain,
    inviteTeammate,
    deleteTeam,
    markAllRead,
    markRead,
    clearNotifs,
    createOrgEvent,
    releaseRoom,
    updateResults,
    toggleParticipant,
    adminAct,
    approveEvent,
    rejectEvent,
    verifyOrganizer,
    banUser,
    unbanUser,
    resolveDispute,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/* ── tiny helpers used across screens ──────────────────────────────────── */
export const clockTime = (d = new Date()) => {
  let h = d.getHours()
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${pad2(d.getMinutes())} ${ap}`
}

export const eventStatus = (e, clock) => {
  if (e.status === 'live') return 'live'
  if (e.status === 'completed') return 'completed'
  const t = new Date(e.startsAt).getTime() - clock
  if (t <= 0) return 'live'
  if (t < HOUR) return 'soon'
  if (e.slotsFilled >= e.slotsTotal) return 'full'
  return 'open'
}

export const DAY_MS = DAY
export const HOUR_MS = HOUR
export const MIN_MS = MIN
