import { useEffect } from 'react'
import { Btn } from './UI'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: 'var(--color-surface)', borderRadius: 14, border: '0.5px solid var(--color-border)', padding: 20, width: '100%', maxWidth: 460, maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--color-text-3)', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        {children}
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

export function FormInput({ ...props }) {
  return (
    <input {...props}
      style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13, outline: 'none', ...props.style }}
      onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
    />
  )
}

export function FormTextarea({ ...props }) {
  return (
    <textarea {...props}
      style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13, outline: 'none', resize: 'vertical', lineHeight: 1.5, ...props.style }}
      onFocus={e => e.target.style.borderColor = 'var(--color-accent)'}
      onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
    />
  )
}

export function FormSelect({ children, ...props }) {
  return (
    <select {...props}
      style={{ width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border)', borderRadius: 'var(--radius)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13, outline: 'none', ...props.style }}>
      {children}
    </select>
  )
}

export function FormRow({ children }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>
}

export function PrioSelector({ value, onChange }) {
  const opts = [
    { key: 'alta', label: '🔴 Alta', bg: '#FCEBEB', border: '#F09595', color: '#A32D2D' },
    { key: 'media', label: '🟡 Media', bg: '#FAEEDA', border: '#FAC775', color: '#633806' },
    { key: 'baja', label: '🟢 Baja', bg: '#EAF3DE', border: '#C0DD97', color: '#27500A' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {opts.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          style={{ flex: 1, padding: '6px', border: `0.5px solid ${value === o.key ? o.border : 'var(--color-border)'}`, borderRadius: 'var(--radius)', fontSize: 11, cursor: 'pointer', fontWeight: value === o.key ? 500 : 400, background: value === o.key ? o.bg : 'var(--color-surface-2)', color: value === o.key ? o.color : 'var(--color-text-2)', transition: 'all .1s' }}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
