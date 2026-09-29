/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — icon set (inline SVG, stroke-based, 24×24)
   ══════════════════════════════════════════════════════════════════════════ */

const P = {
  home: <><path d="M3.2 10.6 12 3.4l8.8 7.2" /><path d="M5.6 9.6V20.6h12.8V9.6" /><path d="M10 20.6v-5.8h4v5.8" /></>,
  crosshair: <><circle cx="12" cy="12" r="8.2" /><circle cx="12" cy="12" r="2.4" /><path d="M12 1.6v3.4M12 19v3.4M1.6 12H5M19 12h3.4" /></>,
  trophy: <><path d="M8 3.6h8v5.2a4 4 0 0 1-8 0z" /><path d="M8 5H5.2v1.6A3 3 0 0 0 8 9.4M16 5h2.8v1.6a3 3 0 0 1-2.8 2.8" /><path d="M12 12.8v3.4M8.6 20.4h6.8l-1-4.2H9.6z" /></>,
  calendar: <><rect x="3.4" y="5" width="17.2" height="15.6" rx="3" /><path d="M3.4 10h17.2M8 3.2v3.6M16 3.2v3.6" /></>,
  user: <><circle cx="12" cy="8.2" r="3.8" /><path d="M4.6 20.4c1.2-3.8 4-5.6 7.4-5.6s6.2 1.8 7.4 5.6" /></>,
  users: <><circle cx="9.4" cy="8.4" r="3.4" /><path d="M3 20c1-3.4 3.4-5 6.4-5s5.4 1.6 6.4 5" /><path d="M16.4 5.4a3.4 3.4 0 0 1 0 6.4M18 14.6c2 .7 3.2 2.3 3.8 4.6" /></>,
  wallet: <><path d="M3.4 8.2A3 3 0 0 1 6.4 5.2h10.4a3 3 0 0 1 3 3v.6" /><rect x="3.4" y="8.2" width="17.2" height="11.4" rx="3" /><circle cx="16.6" cy="13.9" r="1.5" fill="currentColor" stroke="none" /></>,
  bell: <><path d="M6.4 10.4a5.6 5.6 0 0 1 11.2 0c0 4.2 1.4 5.6 1.4 5.6H5s1.4-1.4 1.4-5.6Z" /><path d="M10.2 19.2a2 2 0 0 0 3.6 0" /></>,
  chart: <><path d="M3.4 20.6h17.2" /><path d="M6.6 20.6V13M11.2 20.6V5.6M15.8 20.6v-5M20.4 20.6V9" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.6" /><path d="m15.6 15.6 4.4 4.4" /></>,
  sliders: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2.2" /><circle cx="10" cy="17" r="2.2" /></>,
  filter: <><path d="M3.6 5.4h16.8l-6.6 7.6v6.2l-3.6-2v-4.2z" /></>,
  clock: <><circle cx="12" cy="12" r="8.4" /><path d="M12 7.2V12l3.4 2.2" /></>,
  map: <><path d="M9.2 4.2 3.6 6.6v13.2l5.6-2.4 5.6 2.4 5.6-2.4V4.2l-5.6 2.4z" /><path d="M9.2 4.2v13.2M14.8 6.6v13.2" /></>,
  chevronRight: <path d="m9.4 5.6 6.4 6.4-6.4 6.4" />,
  chevronLeft: <path d="M14.6 5.6 8.2 12l6.4 6.4" />,
  chevronDown: <path d="m5.6 9.2 6.4 6.4 6.4-6.4" />,
  chevronUp: <path d="m5.6 14.8 6.4-6.4 6.4 6.4" />,
  close: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  check: <path d="m4.6 12.6 4.8 4.8L19.4 6.8" />,
  checkCircle: <><circle cx="12" cy="12" r="8.6" /><path d="m8.2 12.2 2.6 2.6 5-5.4" /></>,
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  minus: <path d="M5.2 12h13.6" />,
  shield: <path d="M12 3.2 19.6 6v6.1c0 4.6-3.2 7.5-7.6 8.7-4.4-1.2-7.6-4.1-7.6-8.7V6z" />,
  verified: <><path d="m12 3.2 2.3 1.7 2.8-.2 1 2.7 2.4 1.5-.8 2.7.8 2.7-2.4 1.5-1 2.7-2.8-.2L12 20.8l-2.3-1.7-2.8.2-1-2.7L3.5 15l.8-2.7L3.5 9.7 5.9 8.2l1-2.7 2.8.2z" /><path d="m9.2 12.2 2 2 3.6-4" /></>,
  crown: <path d="M4 17.6h16l-1.4-9-4.1 3.4L12 5.6l-2.5 6.4L5.4 8.6z" />,
  fire: <><path d="M12 3.2s5.6 4 5.6 9.2A5.6 5.6 0 0 1 12 20.8a5.6 5.6 0 0 1-5.6-8.4c1-2 2.6-2.6 2.6-2.6s-.4 2 1 2.8c0-2.6 2-5.4 2-9.4Z" /></>,
  bolt: <path d="M13.4 2.6 5 13.8h5.6L9.8 21.4 19 10.2h-5.8z" />,
  ticket: <><path d="M3.6 8.4A2 2 0 0 1 5.6 6.4h12.8a2 2 0 0 1 2 2v1.4a2.2 2.2 0 0 0 0 4.4v1.4a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2v-1.4a2.2 2.2 0 0 0 0-4.4z" /><path d="M14 8.8v1.6M14 14v1.6" strokeDasharray="0.1 2.6" /></>,
  card: <><rect x="3" y="5.6" width="18" height="12.8" rx="2.8" /><path d="M3 10h18M6.6 14.6h3.2" /></>,
  upi: <><path d="M7.4 3.8 4 12l3.4 8.2M16.6 3.8 20 12l-3.4 8.2" /><path d="M10 15.4 13.4 8.6" /></>,
  bank: <><path d="M3.4 9.6 12 4.2l8.6 5.4" /><path d="M5.6 9.6v8M9.6 9.6v8M14.4 9.6v8M18.4 9.6v8M3.2 20h17.6" /></>,
  rupee: <><path d="M7 4.6h10M7 9.2h10" /><path d="M14.6 4.6c0 3-2.6 4.6-7.6 4.6h1.4L16.4 19.4" /></>,
  arrowUp: <path d="M12 19.6V4.8M6.2 10.6 12 4.8l5.8 5.8" />,
  arrowDown: <path d="M12 4.4v14.8M6.2 13.4 12 19.2l5.8-5.8" />,
  arrowRight: <path d="M4.4 12h14.8M13.4 6.2 19.2 12l-5.8 5.8" />,
  arrowLeft: <path d="M19.6 12H4.8M10.6 6.2 4.8 12l5.8 5.8" />,
  copy: <><rect x="8.6" y="8.6" width="11.8" height="11.8" rx="2.6" /><path d="M15.4 5.6a2 2 0 0 0-2-2H6.2a2.6 2.6 0 0 0-2.6 2.6v7.2a2 2 0 0 0 2 2" /></>,
  share: <><circle cx="17.6" cy="6" r="2.8" /><circle cx="6.4" cy="12" r="2.8" /><circle cx="17.6" cy="18" r="2.8" /><path d="m8.9 10.7 6.2-3.4M8.9 13.3l6.2 3.4" /></>,
  gift: <><rect x="3.6" y="8.4" width="16.8" height="4" rx="1.4" /><path d="M5 12.4v6.6a1.6 1.6 0 0 0 1.6 1.6h10.8a1.6 1.6 0 0 0 1.6-1.6v-6.6M12 8.4v12.2" /><path d="M12 8.4S10.8 4 8.4 4a2.2 2.2 0 0 0 0 4.4zM12 8.4S13.2 4 15.6 4a2.2 2.2 0 0 1 0 4.4z" /></>,
  star: <path d="m12 3.8 2.6 5.4 5.9.8-4.3 4.1 1.1 5.9-5.3-2.9-5.3 2.9 1.1-5.9L3.5 10l5.9-.8z" />,
  eye: <><path d="M2.4 12S6 5.8 12 5.8 21.6 12 21.6 12 18 18.2 12 18.2 2.4 12 2.4 12Z" /><circle cx="12" cy="12" r="3" /></>,
  lock: <><rect x="4.6" y="10.2" width="14.8" height="10" rx="2.8" /><path d="M8.2 10.2V7.8a3.8 3.8 0 0 1 7.6 0v2.4" /><circle cx="12" cy="15.2" r="1.4" fill="currentColor" stroke="none" /></>,
  unlock: <><rect x="4.6" y="10.2" width="14.8" height="10" rx="2.8" /><path d="M8.2 10.2V7.8a3.8 3.8 0 0 1 7.4-1" /><circle cx="12" cy="15.2" r="1.4" fill="currentColor" stroke="none" /></>,
  key: <><circle cx="7.6" cy="15.4" r="3.6" /><path d="m10.2 12.8 8-8M16 7l2 2M14.2 8.8l2 2" /></>,
  flag: <><path d="M5.6 21V3.8M5.6 4.6h11.8l-2 3.8 2 3.8H5.6" /></>,
  alert: <><path d="M12 4.2 21.2 20H2.8z" /><path d="M12 10v4.2" /><circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" /></>,
  info: <><circle cx="12" cy="12" r="8.6" /><path d="M12 11v5.4" /><circle cx="12" cy="8" r="0.9" fill="currentColor" stroke="none" /></>,
  ban: <><circle cx="12" cy="12" r="8.6" /><path d="m6.2 6.2 11.6 11.6" /></>,
  scale: <><path d="M12 3.6v16.8M6 20.4h12M4 8.4h16M8 8.4 5 14.6h6zM16 8.4l-3 6.2h6z" /></>,
  gavel: <><path d="m3.6 20.4 8-8M12.4 5.6l6 6M10 8l6 6M14.8 3.2l6 6" /><path d="M2.8 20.8h7" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="m19.6 14.2-.6-1.4.6-1.4-1.6-2.4-1.6.2-1.2-.8-.4-1.6h-3l-.4 1.6-1.2.8-1.6-.2L5 9.4l.6 1.4-.6 1.4 1.6 2.4 1.6-.2 1.2.8.4 1.6h3l.4-1.6 1.2-.8 1.6.2z" /></>,
  logout: <><path d="M15 4.6h3.4a2 2 0 0 1 2 2v10.8a2 2 0 0 1-2 2H15" /><path d="M10.4 8 6.6 12l3.8 4M6.6 12H16" /></>,
  edit: <><path d="M4.6 19.4h4L20 8a2.4 2.4 0 0 0-3.4-3.4L5.2 16z" /><path d="m14.6 6.4 3 3" /></>,
  trash: <><path d="M4.6 6.6h14.8M9.4 6.6V4.8a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.8" /><path d="M6.6 6.6 7.6 20a1.6 1.6 0 0 0 1.6 1.4h5.6A1.6 1.6 0 0 0 16.4 20l1-13.4" /></>,
  play: <path d="M7.4 4.8 19 12 7.4 19.2z" />,
  live: <><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" /><path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.8 4.8a10.2 10.2 0 0 0 0 14.4M19.2 19.2a10.2 10.2 0 0 0 0-14.4" /></>,
  grid: <><rect x="3.6" y="3.6" width="7" height="7" rx="2" /><rect x="13.4" y="3.6" width="7" height="7" rx="2" /><rect x="3.6" y="13.4" width="7" height="7" rx="2" /><rect x="13.4" y="13.4" width="7" height="7" rx="2" /></>,
  list: <path d="M8 6.4h12M8 12h12M8 17.6h12M4 6.4h.01M4 12h.01M4 17.6h.01" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  dots: <><circle cx="5.6" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="18.4" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20.4 4v4.4H16" /></>,
  sparkles: <><path d="m12 3.6 1.7 4.5 4.5 1.7-4.5 1.7L12 16l-1.7-4.5L5.8 9.8l4.5-1.7z" /><path d="m18.4 15.6.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" /></>,
  medal: <><circle cx="12" cy="14.6" r="5.6" /><path d="m8.4 9.2-2.6-5.6h4.4l1.8 3.8M15.6 9.2l2.6-5.6h-4.4l-1.8 3.8" /><path d="m12 12.2.9 1.8 2 .3-1.4 1.4.3 2-1.8-.9-1.8.9.3-2-1.4-1.4 2-.3z" /></>,
  sword: <><path d="M14.8 3.6h5.6v5.6L10 19.6l-5.6-5.6z" /><path d="m7.2 16.8-3 3M12 12l4.4 4.4" /></>,
  gun: <><path d="M3.6 8.4h13.2l3.6 3.6H10l-1.6 3.2H5.6l1-3.2H3.6z" /><path d="M7.4 15.2v3.2M16.8 12v2.4" /></>,
  headset: <><path d="M4.4 14.6v-2.4a7.6 7.6 0 0 1 15.2 0v2.4" /><rect x="2.8" y="13.6" width="4" height="6" rx="2" /><rect x="17.2" y="13.6" width="4" height="6" rx="2" /><path d="M19.6 19.6v.6a2.4 2.4 0 0 1-2.4 2.4h-2.6" /></>,
  pin: <><path d="M12 21.2s6.6-5.6 6.6-10.4A6.6 6.6 0 0 0 5.4 10.8C5.4 15.6 12 21.2 12 21.2Z" /><circle cx="12" cy="10.6" r="2.4" /></>,
  download: <><path d="M12 3.6v11M7.6 10.4 12 14.8l4.4-4.4" /><path d="M4.4 18.4v1.2a1.6 1.6 0 0 0 1.6 1.6h12a1.6 1.6 0 0 0 1.6-1.6v-1.2" /></>,
  upload: <><path d="M12 15.4V4.4M7.6 8.6 12 4.2l4.4 4.4" /><path d="M4.4 18.4v1.2a1.6 1.6 0 0 0 1.6 1.6h12a1.6 1.6 0 0 0 1.6-1.6v-1.2" /></>,
  send: <path d="M21 3.6 10.4 14.2M21 3.6l-6.6 17.8-4-8.4-8.4-4z" />,
  external: <><path d="M14 4.4h5.6V10" /><path d="M19.6 4.4 11 13" /><path d="M18 14.4v4.4a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 18.8V8a1.6 1.6 0 0 1 1.6-1.6H10" /></>,
  image: <><rect x="3.4" y="4.8" width="17.2" height="14.4" rx="3" /><circle cx="9" cy="10" r="1.8" /><path d="m4.6 17.4 4.6-4.2 3.4 3 2.6-2.2 4.2 3.8" /></>,
  target: <><circle cx="12" cy="12" r="8.4" /><circle cx="12" cy="12" r="4.4" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>,
  zapOff: <path d="M13.4 2.6 5 13.8h5.6L9.8 21.4 19 10.2h-5.8z" />,
  history: <><path d="M3.6 12a8.4 8.4 0 1 0 2.8-6.3" /><path d="M3.2 4.4v4.4h4.4" /><path d="M12 7.6V12l3.2 1.8" /></>,
  sort: <><path d="M7 4.6v14.8M7 19.4 4 16.2M7 19.4l3-3.2M17 19.4V4.6M17 4.6l-3 3.2M17 4.6l3 3.2" /></>,
  shieldCheck: <><path d="M12 3.2 19.6 6v6.1c0 4.6-3.2 7.5-7.6 8.7-4.4-1.2-7.6-4.1-7.6-8.7V6z" /><path d="m9 12 2.2 2.2 4-4.4" /></>,
  money: <><rect x="2.8" y="6.4" width="18.4" height="11.2" rx="2.6" /><circle cx="12" cy="12" r="2.6" /><path d="M6.4 12h.01M17.6 12h.01" /></>,
  phone: <><rect x="6.4" y="2.8" width="11.2" height="18.4" rx="3" /><path d="M10.6 5.6h2.8" /></>,
  wifi: <><path d="M2.6 9.2a14 14 0 0 1 18.8 0M5.8 12.8a9.4 9.4 0 0 1 12.4 0M9 16.4a4.6 4.6 0 0 1 6 0" /><circle cx="12" cy="19.6" r="1.1" fill="currentColor" stroke="none" /></>,
  signal: <path d="M4 18v-2.4M8.6 18v-5.4M13.2 18V9.2M17.8 18V5.6" />,
  battle: <><path d="M12 2.8 3.6 7v6.4c0 4.6 3.6 7.4 8.4 8.6 4.8-1.2 8.4-4 8.4-8.6V7z" /><path d="m8.6 12 2.4 2.4 4.4-4.8" /></>,
}

export function Icon({ name, size = 18, className = '', style, strokeWidth = 1.9, ...rest }) {
  const glyph = P[name] || P.info
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      {...rest}
    >
      {glyph}
    </svg>
  )
}

/* ── WarGrid logo mark ─────────────────────────────────────────────────── */
export function LogoMark({ size = 21 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="wg-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4d95ff" />
          <stop offset="100%" stopColor="#00d5ff" />
        </linearGradient>
        <linearGradient id="wg-y" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd400" />
          <stop offset="100%" stopColor="#e8ff3a" />
        </linearGradient>
      </defs>
      <path d="M3 5.5h6.6l3.6 14.2 3.6-14.2H23l-6 21h-8z" fill="url(#wg-b)" />
      <path d="M21.6 5.5h6.9l2.4 10.2-2.4 10.2h-6.9l2.6-10.2z" fill="url(#wg-y)" />
      <path d="M6.4 9.2h11.2" stroke="rgba(255,255,255,.5)" strokeWidth="1.2" />
    </svg>
  )
}

/* ── map glyph (tiny stylised battle-royale map) ───────────────────────── */
export function MapGlyph({ map = 'Erangel', size = 22 }) {
  const seed = map.length
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true">
      <rect x="1.6" y="3.4" width="20.8" height="17.2" rx="3" stroke="currentColor" strokeWidth="1.5" opacity=".55" />
      <path
        d="M1.6 9.6c3.4 1.6 5.2-1.8 8.2-.4s4.4 4.6 7.6 3.2 5-2.4 5-2.4"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity=".8"
      />
      <path d="M9 3.4v17.2" stroke="currentColor" strokeWidth="1" opacity=".3" strokeDasharray="2 2.4" />
      <circle cx={6 + (seed % 5)} cy={12 + (seed % 3)} r="2.1" fill="currentColor" opacity=".85" />
      <circle cx={6 + (seed % 5)} cy={12 + (seed % 3)} r="4.4" stroke="currentColor" strokeWidth="1" opacity=".35" />
    </svg>
  )
}

/* ── hex decoration used inside banner art ─────────────────────────────── */
export function HexDeco({ className = '' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" aria-hidden="true">
      <path d="M60 4 108 32v56L60 116 12 88V32z" stroke="currentColor" strokeWidth="1.4" opacity=".7" />
      <path d="M60 22 92 41v38L60 98 28 79V41z" stroke="currentColor" strokeWidth="1.2" opacity=".45" />
      <path d="M60 40 76 49v18L60 76 44 67V49z" fill="currentColor" opacity=".18" />
      <path d="M60 4v112M12 32l96 56M108 32 12 88" stroke="currentColor" strokeWidth=".8" opacity=".22" />
    </svg>
  )
}

/* ── status bar icons ──────────────────────────────────────────────────── */
export function SignalIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 20 14" width={size} height={size * 0.7} fill="currentColor" aria-hidden="true">
      <rect x="0" y="9" width="3.2" height="5" rx="1" />
      <rect x="4.6" y="6.4" width="3.2" height="7.6" rx="1" />
      <rect x="9.2" y="3.6" width="3.2" height="10.4" rx="1" />
      <rect x="13.8" y="0.6" width="3.2" height="13.4" rx="1" opacity=".95" />
    </svg>
  )
}
