import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { LOCALES, ROLES_VENDEDOR } from '../lib/constants'
import { Btn, TagNeg, TagTipo, TagNeutral, StatCard, EmptyState, MonthLabel, TagPicker } from '../components/UI'
import Modal, { FormField, FormInput, FormTextarea, FormSelect, FormRow, PrioSelector } from '../components/Modal'
import FichaLayout, { FichaTabs } from '../components/FichaLayout'
import TareaCard from '../components/TareaCard'

function fmtDate(d) { try { return format(parseISO(d), "d MMM yyyy", { locale: es }) } catch { return d } }
function fmtMes(d) { try { const s = format(parseISO(d + 'T12:00'), "MMMM yyyy", { locale: es }); return s.charAt(0).toUpperCase() + s.slice(1) } catch { return d } }
function isOv(d, done) { if (!d || done) return false; try { return new Date(d) < new Date(new Date().toDateString()) } catch { return false } }
function initials(n) { return n?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || '?' }

export default function VendedoresPage({ vendedores, setVendedores, temasData }) {
  const [fichaId, setFichaId] = useState(null)
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalTarea, setModalTarea] = useState(false)
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

  const getTimeline = () => {
    if (!vendedor) return []
    const items = [
      ...temasVend.map(t => ({
        id: 'tema-' + t.id, tipo: 'tema', fecha: t.fecha,
        titulo: t.titulo, notas: t.notas, local: t.local,
        negocios: t.negocios || [], tipos: t.tipos || [],
      })),
      ...tareas.map(t => ({
        id: 'tarea-' + t.id, tipo: 'tarea',
        fecha: t.fecha_limite || t.created_at?.slice(0, 10), raw: t,
      }))
    ]
    return items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }

  const timeline = getTimeline()
  const venc = tareas.filter(t => isOv(t.fecha_limite, t.done)).length
  const pend = tareas.filter(t => !t.done).length
  const comp = tareas.filter(t => t.done).length

  const byMonth = {}
  timeline.forEach(item => {
    const m = fmtMes(item.fecha)
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(item)
  })

  if (!fichaId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Vendedores</div>
          <Btn onClick={() => setModalNuevo(true)}>+ Nuevo vendedor</Btn>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {vendedores.length === 0 ? (
            <EmptyState icon="👥" title="Sin vendedores" subtitle="Agregá el primero con el botón +" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {vendedores.map(v => {
                const tv = (temasData || []).filter(t => t.vendedor_nombre === v.nombre)
                return (
                  <div key={v.id} onClick={() => setFichaId(v.id)}
                    style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'border-color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-accent-bg)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>{initials(v.nombre)}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{v.nombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{v.local}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>{v.roles?.map(r => <TagNeutral key={r} label={r} />)}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>📝 {tv.length} temas involucrado</div>
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
          <div style={{ fontSize: 14, fontWeight: 500 }}>{vendedor?.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{vendedor?.local}{vendedor?.notas ? ` · ${vendedor.notas}` : ''}</div>
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
        <StatCard num={pend} label="Pendientes" />
        <StatCard num={comp} label="Completadas" color="var(--color-success)" />
      </>}
    >
      {timeline.length === 0 ? (
        <EmptyState icon="📋" title="Sin actividad registrada" subtitle="Los temas donde aparece y las tareas asignadas se muestran acá." />
      ) : (
        Object.entries(byMonth).map(([mes, items]) => (
          <div key={mes} style={{ marginBottom: 14 }}>
            <MonthLabel label={mes} />
            {items.map(item => item.tipo === 'tema' ? (
              <div key={item.id} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)', borderRadius: 10, padding: '10px 13px', marginBottom: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Tema</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.titulo}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 3 }}>📅 {fmtDate(item.fecha)} · 📍 {item.local}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 5 }}>
                  {item.negocios.map(n => <TagNeg key={n} label={n} />)}
                  {item.tipos.map(t => <TagTipo key={t} label={t} />)}
                </div>
                {item.notas && <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 7, padding: '7px 10px', background: 'var(--color-surface-2)', borderRadius: 6, lineHeight: 1.5 }}>{item.notas}</div>}
              </div>
            ) : (
              <div key={item.id} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3, paddingLeft: 2 }}>Tarea</div>
                <TareaCard tarea={item.raw} onToggle={() => toggleTarea(item.raw)}
                  onUpdate={u => setTareas(prev => prev.map(tk => tk.id === u.id ? u : tk))}
                  onDelete={id => setTareas(prev => prev.filter(tk => tk.id !== id))} />
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
        <FormField label="Comentario (opcional)"><FormTextarea value={formTarea.comentario} onChange={e => setFormTarea(f => ({ ...f, comentario: e.target.value }))} rows={2} placeholder="Notas..." /></FormField>
      </Modal>
    </FichaLayout>
  )
}
