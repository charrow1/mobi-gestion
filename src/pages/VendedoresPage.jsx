import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { LOCALES, ROLES_VENDEDOR } from '../lib/constants'
import { Btn, TagNeg, TagTipo, TagNeutral, StatCard, EmptyState, MonthLabel, TagPicker, PrioDot, Checkbox } from '../components/UI'
import Modal, { FormField, FormInput, FormTextarea, FormSelect, FormRow, PrioSelector } from '../components/Modal'
import FichaLayout from '../components/FichaLayout'
import TareaCard from '../components/TareaCard'

function fmtDate(d) { try { return format(parseISO(d), "d MMM yyyy", { locale: es }) } catch { return d } }
function fmtMes(d) { try { const s = format(parseISO(d + 'T12:00'), "MMMM yyyy", { locale: es }); return s.charAt(0).toUpperCase() + s.slice(1) } catch { return d } }
function isOv(d, done) { if (!d || done) return false; try { return new Date(d) < new Date(new Date().toDateString()) } catch { return false } }
function initials(n) { return n?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?' }

export default function VendedoresPage({ vendedores, setVendedores, temasData }) {
  const [fichaId, setFichaId] = useState(null)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalTarea, setModalTarea] = useState(false)
  const [showDone, setShowDone] = useState(false)
  const [form, setForm] = useState({ nombre: '', local: LOCALES[0], roles: [], notas: '' })
  const [formTarea, setFormTarea] = useState({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '' })
  const [tareas, setTareas] = useState([])

  const vendedor = vendedores.find(v => v.id === fichaId)

  useEffect(() => {
    if (fichaId) fetchTareas()
  }, [fichaId])

  async function fetchTareas() {
    const { data } = await supabase.from('tareas').select('*').eq('vendedor_id', fichaId).order('created_at', { ascending: false })
    setTareas(data || [])
  }

  async function guardarVendedor() {
    if (!form.nombre.trim()) return
    const { data } = await supabase.from('vendedores').insert({
      nombre: form.nombre.trim(), local: form.local, roles: form.roles, notas: form.notas.trim()
    }).select().single()
    if (data) {
      setVendedores(prev => [...prev, data])
      setModalNuevo(false)
      setForm({ nombre: '', local: LOCALES[0], roles: [], notas: '' })
    }
  }

  async function guardarTarea() {
    if (!formTarea.titulo.trim() || !fichaId || !vendedor) return
    const { data } = await supabase.from('tareas').insert({
      vendedor_id: fichaId,
      local_vendedor: vendedor.local,
      titulo: formTarea.titulo.trim(),
      prioridad: formTarea.prioridad,
      fecha_limite: formTarea.fecha_limite || null,
      tipo: formTarea.tipo || null,
      done: false,
      comentarios: formTarea.comentario.trim() ? [{ text: formTarea.comentario.trim(), ts: new Date().toISOString() }] : []
    }).select().single()
    if (data) {
      setTareas(prev => [data, ...prev])
      setModalTarea(false)
      setFormTarea({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '' })
    }
  }

  async function toggleTarea(t) {
    const { data } = await supabase.from('tareas').update({ done: !t.done }).eq('id', t.id).select().single()
    if (data) setTareas(prev => prev.map(tk => tk.id === data.id ? data : tk))
  }

  const temasVend = vendedor ? (temasData || []).filter(t => t.vendedor_nombre === vendedor.nombre) : []
  const tareasPend = tareas.filter(t => !t.done)
  const tareasComp = tareas.filter(t => t.done)
  const venc = tareasPend.filter(t => isOv(t.fecha_limite, t.done)).length

  const byMonth = {}
  temasVend.forEach(t => {
    const m = fmtMes(t.fecha)
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(t)
  })

  if (!fichaId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 15, fontWeight: 500 }}>Vendedores</div>
          <Btn onClick={() => setModalNuevo(true)}>+ Nuevo vendedor</Btn>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {vendedores.length === 0 ? (
            <EmptyState icon="👥" title="Sin vendedores" subtitle="Agregá el primero con el botón +" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {vendedores.map(v => {
                const tv = (temasData || []).filter(t => t.vendedor_nombre === v.nombre)
                return (
                  <div key={v.id} onClick={() => { setFichaId(v.id); setShowDone(false) }}
                    style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'border-color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-accent-bg)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{initials(v.nombre)}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{v.nombre}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{v.local}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>{v.roles?.map(r => <TagNeutral key={r} label={r} />)}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>📝 {tv.length} temas involucrado</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo vendedor"
          footer={<><Btn variant="ghost" onClick={() => setModalNuevo(false)}>Cancelar</Btn><Btn onClick={guardarVendedor}>✓ Guardar</Btn></>}>
          <FormRow>
            <FormField label="Nombre" style={{ flex: 2 }}>
              <FormInput value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Gonzalo Galván" autoFocus />
            </FormField>
            <FormField label="Local" style={{ flex: 1 }}>
              <FormSelect value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))}>
                {LOCALES.map(l => <option key={l}>{l}</option>)}
              </FormSelect>
            </FormField>
          </FormRow>
          <FormField label="Etiquetas / Rol">
            <TagPicker options={ROLES_VENDEDOR} selected={form.roles} onToggle={v => setForm(f => ({ ...f, roles: f.roles.includes(v) ? f.roles.filter(x => x !== v) : [...f.roles, v] }))} />
          </FormField>
          <FormField label="Notas (opcional)">
            <FormInput value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} placeholder="Cargo, info adicional..." />
          </FormField>
        </Modal>
      </div>
    )
  }

  return (
    <FichaLayout
      toolbar={<>
        <Btn variant="ghost" onClick={() => setFichaId(null)}>← Volver</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{vendedor?.nombre}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{vendedor?.local}{vendedor?.notas ? ` · ${vendedor.notas}` : ''}</div>
        </div>
        <Btn onClick={() => setModalTarea(true)}>+ Nueva tarea</Btn>
      </>}
      infoBar={<>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{vendedor?.roles?.map(r => <TagNeutral key={r} label={r} />)}</div>
        <span>📍 {vendedor?.local}</span>
      </>}
      stats={<>
        <StatCard num={temasVend.length} label="Temas involucrado" />
        <StatCard num={venc} label="Vencidas" color={venc ? 'var(--color-danger)' : undefined} />
        <StatCard num={tareasPend.length} label="Pendientes" />
        <StatCard num={tareasComp.length} label="Completadas" color="var(--color-success)" />
      </>}
    >
      <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            📋 Tareas asignadas {tareasPend.length > 0 && <span style={{ color: venc ? 'var(--color-danger)' : 'var(--color-text-3)' }}>· {tareasPend.length} pendiente{tareasPend.length !== 1 ? 's' : ''}{venc ? ` · ⚠ ${venc} vencida${venc !== 1 ? 's' : ''}` : ''}</span>}
          </div>
          {tareasComp.length > 0 && (
            <button onClick={() => setShowDone(s => !s)}
              style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer' }}>
              {showDone ? '▼ Ocultar completadas' : `▶ Ver completadas (${tareasComp.length})`}
            </button>
          )}
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {tareasPend.length === 0 && !showDone ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--color-text-3)', fontSize: 13 }}>✓ Sin tareas pendientes</div>
          ) : (
            <>
              {tareasPend.map(t => (
                <TareaCard key={t.id} tarea={t}
                  onToggle={() => toggleTarea(t)}
                  onUpdate={u => setTareas(prev => prev.map(tk => tk.id === u.id ? u : tk))}
                  onDelete={id => setTareas(prev => prev.filter(tk => tk.id !== id))} />
              ))}
              {showDone && tareasComp.map(t => (
                <TareaCard key={t.id} tarea={t}
                  onToggle={() => toggleTarea(t)}
                  onUpdate={u => setTareas(prev => prev.map(tk => tk.id === u.id ? u : tk))}
                  onDelete={id => setTareas(prev => prev.filter(tk => tk.id !== id))} />
              ))}
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
        <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border)' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>📝 Historial de temas</span>
        <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border)' }} />
      </div>

      {temasVend.length === 0 ? (
        <EmptyState icon="📝" title="Sin temas relacionados" subtitle="Los temas aparecen acá cuando asignás este vendedor al crear un tema en un local." />
      ) : (
        Object.entries(byMonth).map(([mes, ts]) => (
          <div key={mes} style={{ marginBottom: 12 }}>
            <MonthLabel label={mes} />
            {ts.map(t => (
              <div key={t.id} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)', borderRadius: 10, padding: '10px 13px', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Tema</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.titulo}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 3 }}>📅 {fmtDate(t.fecha)} · 📍 {t.local}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                  {(t.negocios || []).map(n => <TagNeg key={n} label={n} />)}
                  {(t.tipos || []).map(tp => <TagTipo key={tp} label={tp} />)}
                </div>
                {t.notas && <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 7, padding: '7px 10px', background: 'var(--color-surface-2)', borderRadius: 6, lineHeight: 1.6 }}>{t.notas}</div>}
              </div>
            ))}
          </div>
        ))
      )}

      <Modal open={modalTarea} onClose={() => setModalTarea(false)} title={`Nueva tarea — ${vendedor?.nombre}`}
        footer={<><Btn variant="ghost" onClick={() => setModalTarea(false)}>Cancelar</Btn><Btn onClick={guardarTarea}>✓ Crear tarea</Btn></>}>
        <FormField label="Título"><FormInput value={formTarea.titulo} onChange={e => setFormTarea(f => ({ ...f, titulo: e.target.value }))} placeholder="Describí la tarea..." autoFocus /></FormField>
        <FormField label="Prioridad"><PrioSelector value={formTarea.prioridad} onChange={v => setFormTarea(f => ({ ...f, prioridad: v }))} /></FormField>
        <FormRow>
          <FormField label="Fecha límite" style={{ flex: 1 }}><FormInput type="date" value={formTarea.fecha_limite} onChange={e => setFormTarea(f => ({ ...f, fecha_limite: e.target.value }))} /></FormField>
          <FormField label="Tipo" style={{ flex: 1 }}><FormInput value={formTarea.tipo} onChange={e => setFormTarea(f => ({ ...f, tipo: e.target.value }))} placeholder="Ej: RRHH, Ventas..." /></FormField>
        </FormRow>
        <div style={{ background: 'var(--color-accent-bg)', border: '0.5px solid var(--color-accent-border)', borderRadius: 7, padding: '8px 10px', fontSize: 12, color: 'var(--color-accent)', marginBottom: 4 }}>
          📍 Esta tarea también aparece en el historial de <strong>{vendedor?.local}</strong>
        </div>
        <FormField label="Comentario (opcional)"><FormTextarea value={formTarea.comentario} onChange={e => setFormTarea(f => ({ ...f, comentario: e.target.value }))} rows={2} placeholder="Notas..." /></FormField>
      </Modal>
    </FichaLayout>
  )
}
