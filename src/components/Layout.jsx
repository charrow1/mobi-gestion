import { useAuth } from '../hooks/useAuth'
import { Badge } from './UI'

const TABS = [
  { key: 'locales', label: 'Locales', icon: '🏪' },
  { key: 'vendedores', label: 'Vendedores', icon: '👥' },
  { key: 'proveedores', label: 'Proveedores', icon: '🚚' },
  { key: 'tareas', label: 'Tareas', icon: '✅', badge: true },
  { key: 'stock', label: 'Stock', icon: '📦' },
]

export default function Layout({ children, activeTab, onTabChange, subtabs, activeSubtab, onSubtabChange, tareasBadge, onConfig }) {
  const { user, signOut } = useAuth()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--color-bg)' }}>
      {/* Top nav */}
      <div style={{ background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 24px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, flexShrink: 0 }}>✓</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Mobi Gestión</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>Sistema interno</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--color-text-3)' }}>{user?.email}</span>
              <button onClick={onConfig}
                title="Configuración"
                style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', fontSize: 15, color: activeTab === 'config' ? 'var(--color-accent)' : 'var(--color-text-3)', cursor: 'pointer' }}>
                ⚙
              </button>
              <button onClick={signOut}
                style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer' }}>
                Salir
              </button>
            </div>
          </div>

          {/* Main tabs */}
          <div style={{ display: 'flex', padding: '0 24px', overflowX: 'auto' }}>
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => onTabChange(tab.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', fontSize: 13, fontWeight: 500, color: activeTab === tab.key ? 'var(--color-accent)' : 'var(--color-text-3)', cursor: 'pointer', border: 'none', background: 'none', borderBottom: `2px solid ${activeTab === tab.key ? 'var(--color-accent)' : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all .15s' }}>
                <span>{tab.icon}</span>
                {tab.label}
                {tab.badge && tareasBadge > 0 && <Badge count={tareasBadge} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Subtabs */}
      {subtabs && subtabs.length > 0 && (
        <div style={{ background: 'var(--color-surface-2)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', padding: '0 24px', overflowX: 'auto' }}>
            {subtabs.map(st => (
              <button key={st.key} onClick={() => onSubtabChange(st.key)}
                style={{ padding: '7px 16px', fontSize: 12, fontWeight: 500, color: activeSubtab === st.key ? 'var(--color-accent)' : 'var(--color-text-3)', cursor: 'pointer', border: 'none', background: 'none', borderBottom: `2px solid ${activeSubtab === st.key ? 'var(--color-accent)' : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all .15s' }}>
              {st.label}
            </button>
            ))}
          </div>
        </div>
      )}

      {/* Content — centrado con max-width */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
