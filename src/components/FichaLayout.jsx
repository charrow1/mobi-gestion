export default function FichaLayout({ toolbar, infoBar, stats, fichaTabsEl, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexWrap: 'wrap', flexShrink: 0 }}>
        {toolbar}
      </div>
      {/* Info bar */}
      {infoBar && (
        <div style={{ padding: '8px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', fontSize: 11, color: 'var(--color-text-3)', flexShrink: 0 }}>
          {infoBar}
        </div>
      )}
      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', flexShrink: 0 }}>
          {stats}
        </div>
      )}
      {/* Ficha tabs */}
      {fichaTabsEl && (
        <div style={{ padding: '8px 20px 0', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
          {fichaTabsEl}
        </div>
      )}
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

export function FichaTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 1, background: 'var(--color-surface-2)', borderRadius: 8, padding: 3 }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          style={{ flex: 1, padding: '6px', borderRadius: 6, border: 'none', fontSize: 11, fontWeight: active === tab.key ? 500 : 400, cursor: 'pointer', background: active === tab.key ? 'var(--color-surface)' : 'transparent', color: active === tab.key ? 'var(--color-text)' : 'var(--color-text-3)', boxShadow: active === tab.key ? 'var(--shadow)' : 'none', transition: 'all .15s' }}>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
