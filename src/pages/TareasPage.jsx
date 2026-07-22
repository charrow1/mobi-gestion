import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { Btn, PrioDot, StatCard, EmptyState, TagNeutral } from '../components/UI'
import Modal, { FormField, FormInput, FormTextarea, PrioSelector } from '../components/Modal'
import TareaCard from '../components/TareaCard'

function fmtDate(d) { try { return format(parseISO(d), "d MMM yyyy", { locale: es }) } catch { return d } }
function isOv(d, done) { if (!d || done) return false; try { return new Date(d) < new Date(new Date().toDateString()) } catch { return false } }

export default function TareasPage({ onBadgeChange }) {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDone, setShowDone] = useState(false)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '' })

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('tareas')
      .select('*, temas(titulo, local), vendedores(nombre), proveedores(nombre)')
      .order('created_at', { ascending: false })
    const all = data || []
    setTareas(all)
    const venc = all.filter(t => isOv(t.fecha_limite, t.done)).length
    onBadgeChange?.(venc)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function guardarTarea() {
    if (!form.titulo.trim()) return
    const { data } = await supabase.from('tareas').insert({
      titulo: form.titulo.trim(), prioridad: form.prioridad,
      fecha_limite: form.fecha_limite || null, tipo: form.tipo || null, done: false,
      comentarios: form.comentario.trim() ? [{ text: form.comentario.trim(), ts: new Date().toISOString() }] : []
    }).select('*, temas(titulo, local), vendedores(nombre), proveedores(nombre)').single()
    if (data) { setTareas(prev => [data, ...prev]); setModal(false); setForm({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '' }) }
  }

  async function toggleTarea(t) {
    const { data } = await supabase.from('tareas').update({ done: !t.done }).eq('id', t.id).select('*, temas(titulo, local), vendedores(nombre), proveedores(nombre)').single()
    if (data) {
      setTareas(prev => {
        const next = prev.map(tk => tk.id === data.id ? data : tk)
        const venc = next.filter(t => isOv(t.fecha_limite, t.done)).length
        onBadgeChange?.(venc)
        return next
      })
    }
  }

  function getSource(t) {
    if (t.temas) return t.temas.local
    if (t.vendedores) return t.vendedores.nombre
    if (t.proveedores) return t.proveedores.nombre
    return 'Personal'
  }

  const visible = showDone ? tareas : tareas.filter(t => !t.done)
  const sorted = [...visible].sort((a, b) => isOv(a.fecha_limite, a.done) && !isOv(b.fecha_limite, b.done) ? -1 : !isOv(a.fecha_limite, a.done) && isOv(b.fecha_limite, b.done) ? 1 : 0)
  const venc = tareas.filter(t => isOv(t.fecha_limite, t.done)).length
  const pend = tareas.filter(t => !t.done).length
  const comp = tareas.filter(t => t.done).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Todas las tareas</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{pend} pendientes · {venc} vencidas</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-2)', cursor: 'pointer' }}>
          <input type="checkbox" checked={showDone} onChange={e => setShowDone(e.target.checked)} />
          Mostrar completadas
        </label>
        <Btn onClick={() => setModal(true)}>+ Nueva tarea</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', flexShrink: 0 }}>
        <StatCard num={tareas.length} label="Total" />
        <StatCard num={venc} label="Vencidas" color={venc ? 'var(--color-danger)' : undefined} />
        <StatCard num={pend} label="Pendientes" />
        <StatCard num={comp} label="Completadas" color="var(--color-success)" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-3)' }}>Cargando...</div>
          : sorted.length === 0 ? <EmptyState icon="✅" title="Sin tareas pendientes" subtitle="Todas las tareas están al día." />
          : <>
            {venc > 0 && <div style={{ background: 'var(--color-danger-bg)', border: '0.5px solid var(--color-danger-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--color-danger)', marginBottom: 4 }}>⚠ {venc} tarea{venc > 1 ? 's' : ''} vencida{venc > 1 ? 's' : ''} — requieren atención</div>}
            {sorted.map(t => (
              <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginBottom: 2, paddingLeft: 2 }}>
                  <TagNeutral label={getSource(t)} />
                  {t.temas && <span style={{ marginLeft: 4 }}>en "{t.temas.titulo}"</span>}
                </div>
                <TareaCard tarea={t} onToggle={() => toggleTarea(t)}
                  onUpdate={u => setTareas(prev => prev.map(tk => tk.id === u.id ? u : tk))}
                  onDelete={id => setTareas(prev => prev.filter(tk => tk.id !== id))} />
              </div>
            ))}
          </>
        }
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva tarea personal"
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={guardarTarea}>✓ Crear tarea</Btn></>}>
        <FormField label="Título"><FormInput value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Describí la tarea..." autoFocus /></FormField>
        <FormField label="Prioridad"><PrioSelector value={form.prioridad} onChange={v => setForm(f => ({ ...f, prioridad: v }))} /></FormField>
        <FormField label="Fecha límite"><FormInput type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} /></FormField>
        <FormField label="Comentario (opcional)"><FormTextarea value={form.comentario} onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))} rows={2} placeholder="Notas..." /></FormField>
      </Modal>
    </div>
  )
}
