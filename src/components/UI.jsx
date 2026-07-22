import { NEG_COLORS, TIPO_COLORS, PRIO_COLORS } from '../lib/constants'

export function Btn({ children, variant = 'primary', onClick, disabled, style, className }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 'var(--radius)',
    fontSize: 12, fontWeight: 500, cursor: 'pointer',
    border: 'none', transition: 'opacity .15s', whiteSpace: 'nowrap',
  }
  const variants = {
    primary: { background: 'var(--color-accent)', color: '#fff' },
    ghost: { background: 'none', border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)' },
    danger: { background: 'var(--color-danger-bg)', border: '0.5px solid var(--color-danger-border)', color: 'var(--color-danger)' },
  }
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], opacity: disabled ? 0.6 : 1, ...style }}>
      {children}
    </button>
  )
}

export function TagNeg({ label }) {
  const c = NEG_COLORS[label] || { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', background: c.bg, color: c.text, border: `0.5px solid ${c.border}` }}>
      {label}
    </span>
  )
}

export function TagTipo({ label }) {
  const c = TIPO_COLORS[label] || { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', background: c.bg, color: c.text, border: `0.5px solid ${c.border}` }}>
      {label}
    </span>
  )
}

export function TagPerson({ label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', background: 'var(--color-accent-bg)', color: 'var(--color-accent)', border: '0.5px solid var(--color-accent-border)' }}>
      👤 {label}
    </span>
  )
}

export function TagNeutral({ label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 500, whiteSpace: 'nowrap', background: 'var(--color-surface-2)', color: 'var(--color-text-2)', border: '0.5px solid var(--color-border)' }}>
      {label}
    </span>
  )
}

export function PrioDot({ prio }) {
  return <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: PRIO_COLORS[prio] || PRIO_COLORS.media, flexShrink: 0 }} />
}

export function Badge({ count, color = 'danger' }) {
  if (!count) return null
  const colors = {
    danger: { bg: '#EF4444', text: '#fff' },
    accent: { bg: 'var(--color-accent)', text: '#fff' },
  }
  return (
    <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 8, fontWeight: 600, background: colors[color].bg, color: colors[color].text }}>
      {count}
    </span>
  )
}

export function StatCard({ num, label, color }) {
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '9px 12px' }}>
      <div style={{ fontSize: 20, fontWeight: 600, color: color || 'var(--color-text)' }}>{num}</div>
      <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-3)' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-2)', marginBottom: 6 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12 }}>{subtitle}</div>}
    </div>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-3)', fontSize: 13 }}>
      Cargando...
    </div>
  )
}

export function MonthLabel({ label }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      {label}
      <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border)' }} />
    </div>
  )
}

export function TagPicker({ options, selected, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '4px 0' }}>
      {options.map(opt => {
        const isSelected = selected.includes(opt)
        return (
          <button key={opt} onClick={() => onToggle(opt)}
            style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${isSelected ? 'var(--color-accent)' : 'var(--color-border)'}`, fontSize: 11, cursor: 'pointer', fontWeight: isSelected ? 500 : 400, background: isSelected ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: isSelected ? 'var(--color-accent)' : 'var(--color-text-2)', transition: 'all .1s' }}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function Checkbox({ checked, onChange }) {
  return (
    <div onClick={onChange}
      style={{ width: 16, height: 16, minWidth: 16, borderRadius: 4, border: `1.5px solid ${checked ? 'var(--color-success)' : 'var(--color-border-strong)'}`, background: checked ? 'var(--color-success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .15s', flexShrink: 0, marginTop: 2 }}>
      {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>✓</span>}
    </div>
  )
}
