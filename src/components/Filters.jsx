/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — shared filter sheet
   ══════════════════════════════════════════════════════════════════════════ */
import React from 'react'
import { Icon } from '../icons'
import { Btn, Chip, Sheet } from '../ui'
import { cx } from '../utils'

/**
 * sections: [{ key, label, icon, type: 'single' | 'multi', options: [{id,label}] }]
 * value:    { [key]: string | string[] }
 */
export function FilterSheet({ value, onChange, sections, onClose, onReset, title = 'Filters', applyLabel = 'Show battles' }) {
  const set = (key, id, type) => {
    if (type === 'single') return onChange({ ...value, [key]: id })
    const cur = value[key] || []
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]
    onChange({ ...value, [key]: next })
  }
  const activeCount = sections.reduce((n, s) => {
    const v = value[s.key]
    if (Array.isArray(v)) return n + v.length
    if (v && v !== 'any') return n + 1
    return n
  }, 0)

  return (
    <Sheet
      title={title}
      subtitle={activeCount ? `${activeCount} active` : 'Refine your battle feed'}
      icon="sliders"
      onClose={onClose}
      footer={
        <>
          <Btn variant="ghost" onClick={onReset}>
            Reset
          </Btn>
          <Btn variant="primary" icon="crosshair" onClick={onClose}>
            {applyLabel}
          </Btn>
        </>
      }
    >
      <div className="col gap-16">
        {sections.map((s) => (
          <div key={s.key}>
            <div className="row gap-8" style={{ marginBottom: 9 }}>
              <Icon name={s.icon || 'filter'} size={13} className="blue" />
              <span className="kicker blue">{s.label}</span>
            </div>
            <div className="row wrap gap-8">
              {s.options.map((o) => {
                const active = Array.isArray(value[s.key]) ? (value[s.key] || []).includes(o.id) : value[s.key] === o.id
                return (
                  <Chip key={o.id} active={active} yellow={s.key === 'prize'} onClick={() => set(s.key, o.id, s.type)}>
                    {o.icon && <Icon name={o.icon} size={12} />}
                    {o.label}
                    {o.count !== undefined && <span className="count">{o.count}</span>}
                  </Chip>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </Sheet>
  )
}

export function SortBar({ options, value, onChange }) {
  return (
    <div className="row gap-8">
      <Icon name="sort" size={14} className="faint" />
      <div className="chip-scroll" style={{ margin: 0, padding: 0 }}>
        {options.map((o) => (
          <Chip key={o.id} active={value === o.id} onClick={() => onChange(o.id)}>
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  )
}
