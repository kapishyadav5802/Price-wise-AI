/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — utils
   ══════════════════════════════════════════════════════════════════════════ */

export const MIN = 60 * 1000
export const HOUR = 60 * MIN
export const DAY = 24 * HOUR

/** ₹1,25,000 — Indian digit grouping */
export function inr(n) {
  if (n === 0) return 'FREE'
  return '₹' + Number(n).toLocaleString('en-IN')
}

/** compact money for tight spaces → ₹5L / ₹25K */
export function inrShort(n) {
  if (!n) return 'FREE'
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(n % 10000000 === 0 ? 0 : 1) + 'Cr'
  if (n >= 100000) return '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + 'L'
  if (n >= 1000) return '₹' + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'K'
  return '₹' + n
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Sat, 4 Oct */
export function fmtDate(d) {
  const x = new Date(d)
  return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]}`
}
export function fmtDateShort(d) {
  const x = new Date(d)
  return `${x.getDate()} ${MONTHS[x.getMonth()]}`
}
/** 8:30 PM */
export function fmtTime(d) {
  const x = new Date(d)
  let h = x.getHours()
  const m = String(x.getMinutes()).padStart(2, '0')
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}
export function fmtDayLabel(d) {
  const x = new Date(d)
  const today = new Date()
  const isToday = x.toDateString() === today.toDateString()
  const isTmr = x.toDateString() === new Date(today.getTime() + DAY).toDateString()
  if (isToday) return 'Today'
  if (isTmr) return 'Tomorrow'
  return DAYS[x.getDay()]
}
/** Today · 8:30 PM */
export function fmtWhen(d) {
  return `${fmtDayLabel(d)} · ${fmtTime(d)}`
}

export function relTime(d) {
  const diff = new Date(d).getTime() - Date.now()
  const abs = Math.abs(diff)
  const past = diff < 0
  let out
  if (abs < MIN) out = 'just now'
  else if (abs < HOUR) out = `${Math.floor(abs / MIN)}m`
  else if (abs < DAY) out = `${Math.floor(abs / HOUR)}h`
  else out = `${Math.floor(abs / DAY)}d`
  if (out === 'just now') return out
  return past ? `${out} ago` : `in ${out}`
}

/** countdown parts */
export function cdParts(target, now = Date.now()) {
  let diff = Math.max(0, new Date(target).getTime() - now)
  const d = Math.floor(diff / DAY)
  diff -= d * DAY
  const h = Math.floor(diff / HOUR)
  diff -= h * HOUR
  const m = Math.floor(diff / MIN)
  const s = Math.floor((diff - m * MIN) / 1000)
  return { d, h, m, s, done: diff <= 0 }
}
/** 02:14:36 */
export function cdClock(target, now = Date.now()) {
  const { d, h, m, s, done } = cdParts(target, now)
  if (done) return '00:00:00'
  const hh = String(d * 24 + h).padStart(2, '0')
  return `${hh}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
export function cdHuman(target, now = Date.now()) {
  const { d, h, m, s, done } = cdParts(target, now)
  if (done) return 'Starting now'
  if (d > 0) return `${d}d ${h}h left`
  if (h > 0) return `${h}h ${m}m left`
  if (m > 0) return `${m}m ${s}s left`
  return `${s}s left`
}

export const pad2 = (n) => String(n).padStart(2, '0')

export function initials(name = '') {
  const parts = String(name).replace(/[^\w\s]/g, ' ').trim().split(/\s+/)
  if (!parts[0]) return 'WG'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const cx = (...xs) => xs.filter(Boolean).join(' ')

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n))

export const sum = (arr, f = (x) => x) => arr.reduce((a, b) => a + f(b), 0)

export function pct(a, b) {
  return b ? Math.round((a / b) * 100) : 0
}

/** random-ish deterministic helper for mock live feeds */
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

export function maskRoom(code) {
  return String(code).replace(/./g, '•')
}
