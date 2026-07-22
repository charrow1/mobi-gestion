import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Btn } from '../components/UI'
import Modal, { FormField, FormInput, FormSelect } from '../components/Modal'

const CATEGORIAS = [
  { key: 'negocio', label: 'Negocios', desc: 'Categorías de negocio usadas en temas y ajustes de stock', icon: '🏷' },
  { key: 'tipo_tema', label: 'Tipos de tema', desc: 'Tipos usados para clasificar los temas en los locales', icon: '📌' },
]

export default function ConfigPage({ etiquetas, setEtiquetas }) {
  const [modal, setModal] = useState(false)
  const [editEt, setEditEt] = useState(null)
  const [form, setForm] = useState({ nombre: '', categoria: 'negocio' })
  const [deleting, setDeleting] = useState(null)

  function openNew(cat) {
    setEditEt(null)
    setForm({ nombre: '', categoria: cat })
    setModal(true)
  }

  function openEdit(et) {
    setEditEt(et)
    setForm({ nombre: et.nombre, categoria: et.categoria })
    setModal(true)
  }

  async function guardar() {
    if (!form.nombre.trim()) return
    if (editEt) {
      const { data } = await supabase.from('etiquetas').update({ nombre: form.nombre.trim() }).eq('id', editEt.id).select().single()
      if (data) setEtiquetas(prev => prev.map(e => e.id === data.id ? data : e))
    } else {
      const orden = etiquetas.filter(e => e.categoria === form.categoria).length + 1
      const { data } = await supabase.from('etiquetas').insert({ nombre: form.nombre.trim(), categoria: form.categoria, orden }).select().single()
      if (data) setEtiquetas(prev => [...prev, data])
    }
    setModal(false)
  }

  async function eliminar(et) {
    if (!confirm(`¿Eliminar la etiqueta "${et.nombre}"? Los temas que la usan no se verán afectados.`)) return
    setDeleting(et.id)
    await supabase.from('etiquetas').delete().eq('id', et.id)
    setEtiquetas(prev => prev.filter(e => e.id !== et.id))
    setDeleting(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Configuración</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>Gestión de etiquetas del sistema</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {CATEGORIAS.map(cat => {
          const ets = etiquetas.filter(e => e.categoria === cat.key).sort((a, b) => a.orden - b.orden)
          return (
            <div key={cat.key} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{cat.desc}</div>
                </div>
                <Btn onClick={() => openNew(cat.key)}>+ Agregar</Btn>
              </div>

              {ets.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-3)', fontSize: 13 }}>
                  Sin etiquetas. Agregá la primera.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {ets.map((et, i) => (
                    <div key={et.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: i < ets.length - 1 ? '0.5px solid var(--color-border)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--color-surface-2)', border: '0.5px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)' }}>
                        {et.orden}
                      </div>
                      <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{et.nombre}</div>
                      <EtiquetaPreview nombre={et.nombre} categoria={et.categoria} />
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => openEdit(et)}
                          style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--color-text-2)', cursor: 'pointer' }}>
                          Editar
                        </button>
                        <button onClick={() => eliminar(et)} disabled={deleting === et.id}
                          style={{ background: 'none', border: '0.5px solid var(--color-danger-border)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--color-danger)', cursor: 'pointer', opacity: deleting === et.id ? 0.5 : 1 }}>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ background: 'var(--color-accent-bg)', border: '0.5px solid var(--color-accent-border)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--color-accent)' }}>
          💡 Las etiquetas que eliminás no afectan los temas o ajustes que ya las tienen asignadas. Solo dejan de aparecer como opción al crear nuevos registros.
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editEt ? 'Editar etiqueta' : 'Nueva etiqueta'}
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={guardar}>✓ Guardar</Btn></>}>
        {!editEt && (
          <FormField label="Categoría">
            <FormSelect value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
              {CATEGORIAS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </FormSelect>
          </FormField>
        )}
        <FormField label="Nombre">
          <FormInput value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            placeholder={form.categoria === 'negocio' ? 'Ej: Motos, Hogar...' : 'Ej: Stock, Ventas...'}
            autoFocus onKeyDown={e => e.key === 'Enter' && guardar()} />
        </FormField>
        {form.nombre.trim() && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 6 }}>Vista previa:</div>
            <EtiquetaPreview nombre={form.nombre} categoria={form.categoria} />
          </div>
        )}
      </Modal>
    </div>
  )
}

function EtiquetaPreview({ nombre, categoria }) {
  const NEG_COLORS = {
    'Motos': { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
    'Hogar': { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD' },
    'Repuestos y Accesorios': { bg: '#D1FAE5', color: '#065F46', border: '#6EE7B7' },
    'Productos de Fuerza': { bg: '#FCE7F3', color: '#9D174D', border: '#F9A8D4' },
    'Náutica': { bg: '#E0E7FF', color: '#3730A3', border: '#A5B4FC' },
  }
  const TIPO_COLORS = {
    'Stock': { bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' },
    'Ventas': { bg: '#EAF3DE', color: '#3B6D11', border: '#C0DD97' },
    'RRHH': { bg: '#EEEDFE', color: '#534AB7', border: '#CECBF6' },
    'Precios': { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
    'Marketing': { bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
    'Admin': { bg: '#F8FAFC', color: '#475569', border: '#CBD5E1' },
  }
  const map = categoria === 'negocio' ? NEG_COLORS : TIPO_COLORS
  const c = map[nombre] || { bg: 'var(--color-surface-2)', color: 'var(--color-text-2)', border: 'var(--color-border)' }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '2px 9px', borderRadius: 20, fontWeight: 500, background: c.bg, color: c.color, border: `0.5px solid ${c.border}` }}>
      {nombre}
    </span>
  )
}
