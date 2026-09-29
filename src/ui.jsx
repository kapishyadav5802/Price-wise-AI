/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — UI primitives
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon, LogoMark, MapGlyph, HexDeco } from './icons'
import { useOverlayHost } from './overlay'
import { cx, inr, inrShort, initials, cdParts, fmtTime, fmtWhen, relTime, pct } from './utils'
import { useWG } from './store'

/* ── Banner art ─────────────────────────────────────────────────────────── */
export function Art({ variant = 'art-1', className = '', children, hex = true, glow = 'rgba(45,125,255,.55)', style }) {
  return (
    <div className={cx('art', variant, className)} style={style}>
      <div className="art-grid" />
      <div className="art-glow" style={{ background: glow, left: '-40px', top: '-60px' }} />
      <div className="art-glow" style={{ background: 'rgba(232,255,58,.22)', right: '-50px', bottom: '-70px', animationDelay: '-3s' }} />
      <div className="art-ray" />
      {hex && <HexDeco className="art-hex" />}
      <div className="art-noise" />
      <div className="art-scrim" />
      {children}
    </div>
  )
}

/* ── Logo ───────────────────────────────────────────────────────────────── */
export function Logo({ compact = false }) {
  return (
    <div className="logo">
      <div className="logo-mark">
        <LogoMark />
      </div>
      {!compact && (
        <div className="logo-type">
          WAR<i>GRID</i>
          <s>Battle Booking</s>
        </div>
      )}
    </div>
  )
}

/* ── Avatar ─────────────────────────────────────────────────────────────── */
export function Avatar({ name = '', tone = 'blue', size = 'md', ring = false }) {
  const av = (
    <div className={cx('avatar', size, `tone-${tone}`)}>
      <span>{initials(name)}</span>
    </div>
  )
  return ring ? <div className="avatar-ring">{av}</div> : av
}

/* ── Button ─────────────────────────────────────────────────────────────── */
export function Btn({ children, variant = 'primary', size, icon, iconRight, block, cut, disabled, loading, className = '', onClick, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cx('btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', cut && 'btn-cut', className)}
      {...rest}
    >
      {loading ? <span className="spinner" /> : icon ? <Icon name={icon} /> : null}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </button>
  )
}

/** the hero CTA — BOOK YOUR BATTLE */
export function CtaButton({ onClick, sub = 'Play. Compete. Conquer.' }) {
  return (
    <button className="btn-cta" onClick={onClick}>
      <span className="btn-cta-glow" />
      <b>Book Your Battle</b>
      <small>{sub}</small>
    </button>
  )
}

/* ── Badge ──────────────────────────────────────────────────────────────── */
export function Badge({ tone = 'blue', children, icon }) {
  return (
    <span className={cx('badge', tone)}>
      {icon && <Icon name={icon} size={11} strokeWidth={2.2} />}
      {children}
    </span>
  )
}

export function LiveBadge({ label = 'Live' }) {
  return (
    <span className="live-badge">
      <span className="live-dot" /> {label}
    </span>
  )
}

/* ── Chips ──────────────────────────────────────────────────────────────── */
export function Chip({ active, children, onClick, count, yellow }) {
  return (
    <button className={cx('chip', active && 'active', active && yellow && 'yellow')} onClick={onClick}>
      {children}
      {count !== undefined && <span className="count">{count}</span>}
    </button>
  )
}

/* ── Progress ───────────────────────────────────────────────────────────── */
export function Progress({ value, max = 100, tone, thin, thick, className = '', style }) {
  const p = Math.min(100, pct(value, max))
  return (
    <div className={cx('progress', thin && 'thin', thick && 'thick', className)} style={style}>
      <i className={tone || (p > 88 ? 'hot' : p > 65 ? 'gold' : '')} style={{ width: `${p}%` }} />
    </div>
  )
}

/* ── Countdown ──────────────────────────────────────────────────────────── */
export function Countdown({ target, gold, size = 'md', labels = true }) {
  const { clock } = useWG()
  const { d, h, m, s, done } = cdParts(target, clock)
  if (done)
    return (
      <div className={cx('cd-inline', 'urgent')} style={{ fontSize: size === 'sm' ? 13 : 17 }}>
        LIVE NOW
      </div>
    )
  const cells = d > 0 ? [
    [d, 'Days'],
    [h, 'Hrs'],
    [m, 'Min'],
    [s, 'Sec'],
  ] : [
    [h, 'Hrs'],
    [m, 'Min'],
    [s, 'Sec'],
  ]
  return (
    <div className="countdown">
      {cells.map(([v, l]) => (
        <div key={l} className={cx('cd-cell', gold && 'gold')} style={size === 'sm' ? { minWidth: 36, padding: '5px 4px 4px' } : null}>
          <b style={size === 'sm' ? { fontSize: 15 } : null}>{String(v).padStart(2, '0')}</b>
          {labels && <u>{l}</u>}
        </div>
      ))}
    </div>
  )
}

export function CdInline({ target, urgentBelow = 3600000 }) {
  const { clock } = useWG()
  const p = cdParts(target, clock)
  if (p.done) return <span className="cd-inline urgent">NOW</span>
  const total = new Date(target).getTime() - clock
  const txt = p.d > 0 ? `${p.d}d ${p.h}h` : p.h > 0 ? `${p.h}h ${p.m}m` : `${p.m}m ${p.s}s`
  return <span className={cx('cd-inline', total < urgentBelow && 'urgent')}>{txt}</span>
}

/* ── Count-up number ────────────────────────────────────────────────────── */
export function CountUp({ value = 0, prefix = '', suffix = '', ms = 750, className = '' }) {
  const [n, setN] = useState(0)
  const raf = useRef()
  useEffect(() => {
    const start = performance.now()
    const from = 0
    const tick = (t) => {
      const k = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      setN(Math.round(from + (value - from) * e))
      if (k < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value, ms])
  return (
    <span className={className}>
      {prefix}
      {n.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

/* ── Search ─────────────────────────────────────────────────────────────── */
export function SearchBar({ value, onChange, placeholder = 'Search tournaments, scrims, organisers…', hint }) {
  return (
    <div className="searchbar">
      <Icon name="search" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value ? (
        <button className="clear" onClick={() => onChange('')} aria-label="clear">
          ✕
        </button>
      ) : hint ? (
        <span className="kbd">{hint}</span>
      ) : null}
    </div>
  )
}

/* ── Section head ───────────────────────────────────────────────────────── */
export function SectionHead({ title, accent, action, onAction, rule }) {
  return (
    <div className="section-head">
      <h3>
        {title} {accent && <b>{accent}</b>}
      </h3>
      {rule && <div className="rule" />}
      {action && (
        <button className="link" onClick={onAction}>
          {action} <Icon name="chevronRight" size={12} strokeWidth={2.6} />
        </button>
      )}
    </div>
  )
}

/* ── Stat tile ──────────────────────────────────────────────────────────── */
export function StatTile({ label, value, sub, tone, spark, prefix, icon }) {
  return (
    <div className={cx('stat-tile', tone)}>
      <u>
        {icon && <Icon name={icon} size={11} strokeWidth={2.4} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 5 }} />}
        {label}
      </u>
      <b className={tone === 'gold' ? 'gold' : tone === 'green' ? 'green' : ''}>
        {typeof value === 'number' ? <CountUp value={value} prefix={prefix || ''} /> : value}
      </b>
      {sub && <span>{sub}</span>}
      {spark && (
        <div className="spark">
          {spark.map((v, i) => (
            <i key={i} style={{ height: `${Math.max(12, v)}%`, animationDelay: `${i * 0.04}s` }} />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Empty state ────────────────────────────────────────────────────────── */
export function EmptyState({ icon = 'target', title, body, action, onAction }) {
  return (
    <div className="empty">
      <div className="ei">
        <Icon name={icon} size={26} />
      </div>
      <b>{title}</b>
      {body && <p>{body}</p>}
      {action && (
        <Btn variant="outline" size="sm" className="center" style={{ margin: '14px auto 0' }} onClick={onAction} iconRight="arrowRight">
          {action}
        </Btn>
      )}
    </div>
  )
}

/* ── Form bits ──────────────────────────────────────────────────────────── */
export function Field({ label, children, hint, error, ok }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {(hint || error || ok) && <div className={cx('hint', error && 'err', ok && 'ok')}>{error || ok || hint}</div>}
    </div>
  )
}

export const Input = React.forwardRef(function Input({ className = '', ...p }, ref) {
  return <input ref={ref} className={cx('input', className)} {...p} />
})

export function Select({ className = '', children, ...p }) {
  return (
    <select className={cx('select', className)} {...p}>
      {children}
    </select>
  )
}

export function Textarea({ className = '', ...p }) {
  return <textarea className={cx('textarea', className)} {...p} />
}

export function Toggle({ on, onChange, label }) {
  return (
    <button className={cx('toggle', on && 'on')} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />
  )
}

export function Segmented({ options, value, onChange, yellow }) {
  return (
    <div className={cx('segmented', yellow && 'yellow')}>
      {options.map((o) => (
        <button key={o.id ?? o} className={cx(value === (o.id ?? o) && 'active')} onClick={() => onChange(o.id ?? o)}>
          {o.label ?? o}
        </button>
      ))}
    </div>
  )
}

export function Tabs({ options, value, onChange }) {
  return (
    <div className="tabs">
      {options.map((o) => (
        <button key={o.id} className={cx(value === o.id && 'active')} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

/* ── Info row ───────────────────────────────────────────────────────────── */
export function InfoRow({ icon, label, value, tone, right, onClick }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp className="info-row" style={onClick ? { width: '100%', textAlign: 'left' } : null} onClick={onClick}>
      {icon && (
        <span className={cx('ico', tone === 'gold' && 'gold')}>
          <Icon name={icon} />
        </span>
      )}
      <span className="txt grow">
        <u>{label}</u>
        <b>{value}</b>
      </span>
      {right}
    </Comp>
  )
}

/* ── Sheet ──────────────────────────────────────────────────────────────── */
export function Sheet({ title, subtitle, onClose, children, footer, icon }) {
  const host = useOverlayHost()
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  const node = (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="sheet-head">
          {icon && (
            <span className="ico" style={{ width: 30, height: 30, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(45,125,255,.14)', color: 'var(--blue-hi)' }}>
              <Icon name={icon} size={15} />
            </span>
          )}
          <div>
            <h3>{title}</h3>
            {subtitle && <div className="kicker" style={{ marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button className="close" onClick={onClose} aria-label="close">
            <Icon name="close" size={14} strokeWidth={2.4} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </>
  )
  if (host && typeof document !== 'undefined') return createPortal(node, host)
  return node
}

/* ── Screen header (back + title) ───────────────────────────────────────── */
export function ScreenHeader({ title, subtitle, onBack, right, transparent }) {
  return (
    <div className={cx('app-header', transparent && 'flush')}>
      <div className="row gap-10">
        <button className="back-btn" onClick={onBack} aria-label="back">
          <Icon name="chevronLeft" strokeWidth={2.4} />
        </button>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="h-head truncate" style={{ fontSize: 15.5 }}>{title}</div>
          {subtitle && <div className="kicker truncate" style={{ marginTop: 3 }}>{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  )
}

/* ── misc ───────────────────────────────────────────────────────────────── */
export function Money({ value, short, className = '' }) {
  return <span className={className}>{short ? inrShort(value) : inr(value)}</span>
}

export function SlotMeter({ filled, total, label = 'Slots' }) {
  const left = Math.max(0, total - filled)
  return (
    <>
      <div className="slot-line">
        <span>
          {label}: <b>{filled}</b>/{total}
        </span>
        <span className={left <= 3 ? 'red' : left <= 8 ? 'yellow' : 'green'}>
          {left === 0 ? 'FULL' : `${left} LEFT`}
        </span>
      </div>
      <Progress value={filled} max={total} />
    </>
  )
}

export function ArtPicker({ value, onChange }) {
  const variants = ['art-1', 'art-2', 'art-3', 'art-4', 'art-5', 'art-6', 'art-7', 'art-8']
  return (
    <div className="art-picker">
      {variants.map((v) => (
        <button key={v} className={cx(v, value === v && 'sel')} onClick={() => onChange(v)} aria-label={`banner ${v}`} />
      ))}
    </div>
  )
}

export function MapChip({ map }) {
  return (
    <span className="mini-tag blue">
      <MapGlyph map={map} size={11} /> {map}
    </span>
  )
}

export function TimeAgo({ at }) {
  const { clock } = useWG()
  return <time key={clock}>{relTime(at)}</time>
}

export function WhenLine({ at, icon = 'clock' }) {
  return (
    <span className="mini-tag">
      <Icon name={icon} size={10} /> {fmtWhen(at)}
    </span>
  )
}
