import { useState, useEffect } from 'react'
import { format, parseISO, isPast } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { NEGOCIOS } from '../lib/constants'
import { Btn, TagNeutral, StatCard, EmptyState, MonthLabel, PrioDot } from '../components/UI'
import Modal, { FormField, FormInput, FormTextarea, FormSelect, FormRow, PrioSelector } from '../components/Modal'
import FichaLayout, { FichaTabs } from '../components/FichaLayout'
import TareaCard from '../components/TareaCard'

function fmtDate(d) { try { return format(parseISO(d), "d MMM yyyy", { locale: es }) } catch { return d } }
function fmtMes(d) { try { const s = format(parseISO(d + 'T12:00'), "MMMM yyyy", { locale: es }); return s.charAt(0).toUpperCase() + s.slice(1) } catch { return d } }
function isOv(d, done) { if (!d || done) return false; try { return new Date(d) < new Date(new Date().toDateString()) } catch { return false } }

const FICHA_TABS = [
  { key: 'hist', label: '📝 Historial' },
  { key: 'tareas', label: '📋 Tareas' },
  { key: 'cond', label: '💰 Condiciones' },
]

export default function ProveedoresPage({ proveedores, setProveedores }) {
  const [fichaId, setFichaId] = useState(null)
  const [fichaTab, setFichaTab] = useState('hist')
  const [negFilter, setNegFilter] = useState('')
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalReunion, setModalReunion] = useState(false)
  const [modalTarea, setModalTarea] = useState(false)
  const [reuniones, setReuniones] = useState([])
  const [tareas, setTareas] = useState([])
  const [form, setForm] = useState({ nombre: '', negocio: NEGOCIOS[0], estado: 'Activo', marcas: '', cats: '', contacto: '', descuento: '', plazo: '' })
  const [formReun, setFormReun] = useState({ fecha: new Date().toISOString().slice(0, 10), titulo: '', notas: '' })
  const [formTarea, setFormTarea] = useState({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '', reunion_id: '' })

  const proveedor = proveedores.find(p => p.id === fichaId)

  useEffect(() => {
    if (fichaId) { fetchReuniones(); fetchTareas() }
  }, [fichaId])

  async function fetchReuniones() {
    const { data } = await supabase.from('reuniones').select('*').eq('proveedor_id', fichaId).order('fecha', { ascending: false })
    setReuniones(data || [])
  }

  async function fetchTareas() {
    const { data } = await supabase.from('tareas').select('*').eq('proveedor_id', fichaId).order('created_at', { ascending: false })
    setTareas(data || [])
  }

  async function guardarProveedor() {
    if (!form.nombre.trim()) return
    const { data } = await supabase.from('proveedores').insert({ nombre: form.nombre.trim(), negocio: form.negocio, estado: form.estado, marcas: form.marcas, categorias: form.cats, contacto: form.contacto, descuento: form.descuento, plazo_pago: form.plazo }).select().single()
    if (data) { setProveedores(prev => [...prev, data]); setModalNuevo(false); setForm({ nombre: '', negocio: NEGOCIOS[0], estado: 'Activo', marcas: '', cats: '', contacto: '', descuento: '', plazo: '' }) }
  }

  async function guardarReunion() {
    if (!formReun.titulo.trim()) return
    const { data } = await supabase.from('reuniones').insert({ proveedor_id: fichaId, fecha: formReun.fecha, titulo: formReun.titulo.trim(), notas: formReun.notas.trim() }).select().single()
    if (data) { setReuniones(prev => [data, ...prev]); setModalReunion(false); setFormReun({ fecha: new Date().toISOString().slice(0, 10), titulo: '', notas: '' }) }
  }

  async function guardarTarea() {
    if (!formTarea.titulo.trim()) return
    const { data } = await supabase.from('tareas').insert({
      proveedor_id: fichaId, reunion_id: formTarea.reunion_id || null,
      titulo: formTarea.titulo.trim(), prioridad: formTarea.prioridad,
      fecha_limite: formTarea.fecha_limite || null, tipo: formTarea.tipo || null,
      done: false, comentarios: formTarea.comentario.trim() ? [{ text: formTarea.comentario.trim(), ts: new Date().toISOString() }] : []
    }).select().single()
    if (data) { setTareas(prev => [data, ...prev]); setModalTarea(false); setFormTarea({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '', reunion_id: '' }) }
  }

  async function toggleTarea(t) {
    const { data } = await supabase.from('tareas').update({ done: !t.done }).eq('id', t.id).select().single()
    if (data) setTareas(prev => prev.map(tk => tk.id === data.id ? data : tk))
  }

  const filtered = negFilter ? proveedores.filter(p => p.negocio === negFilter) : proveedores
  const venc = tareas.filter(t => isOv(t.fecha_limite, t.done)).length
  const pend = tareas.filter(t => !t.done).length

  // Timeline: mezcla de reuniones y tareas sin reunión, ordenadas por fecha
  const timeline = [
    ...reuniones.map(r => ({ ...r, _tipo: 'reunion', _tareas: tareas.filter(t => t.reunion_id === r.id) })),
    ...tareas.filter(t => !t.reunion_id).map(t => ({ ...t, _tipo: 'tarea' }))
  ].sort((a, b) => new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at))

  const byMonth = timeline.reduce((acc, e) => {
    const d = e.fecha || e.created_at?.slice(0, 10)
    const m = fmtMes(d); if (!acc[m]) acc[m] = []; acc[m].push(e); return acc
  }, {})

  // Vista lista
  if (!fichaId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
          <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>Proveedores</div>
          <Btn onClick={() => setModalNuevo(true)}>+ Nuevo proveedor</Btn>
        </div>
        {/* Filtro negocio */}
        <div style={{ display: 'flex', gap: 6, padding: '8px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', overflowX: 'auto', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>Negocio:</span>
          {['Todos', ...NEGOCIOS].map(n => (
            <button key={n} onClick={() => setNegFilter(n === 'Todos' ? '' : n)}
              style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${(negFilter === n || (!negFilter && n === 'Todos')) ? 'var(--color-accent-border)' : 'var(--color-border)'}`, fontSize: 11, cursor: 'pointer', background: (negFilter === n || (!negFilter && n === 'Todos')) ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: (negFilter === n || (!negFilter && n === 'Todos')) ? 'var(--color-accent)' : 'var(--color-text-2)', fontWeight: (negFilter === n || (!negFilter && n === 'Todos')) ? 500 : 400, whiteSpace: 'nowrap' }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="🚚" title="Sin proveedores" subtitle="Agregá el primero con el botón +" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {filtered.map(p => (
                <div key={p.id} onClick={() => { setFichaId(p.id); setFichaTab('hist') }}
                  style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, padding: 14, cursor: 'pointer', transition: 'border-color .15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-border-strong)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 8 }}>
                    {p.negocio} · <span style={{ color: p.estado === 'Activo' ? 'var(--color-success)' : 'var(--color-warning)' }}>{p.estado}</span>
                  </div>
                  {p.marcas && <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>
                    {p.marcas.split(',').map(m => <TagNeutral key={m} label={m.trim()} />)}
                  </div>}
                  {p.categorias && <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 5 }}>{p.categorias}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <Modal open={modalNuevo} onClose={() => setModalNuevo(false)} title="Nuevo proveedor"
          footer={<><Btn variant="ghost" onClick={() => setModalNuevo(false)}>Cancelar</Btn><Btn onClick={guardarProveedor}>✓ Guardar</Btn></>}>
          <FormField label="Nombre"><FormInput value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Honda Argentina" autoFocus /></FormField>
          <FormRow>
            <FormField label="Negocio" style={{ flex: 1 }}><FormSelect value={form.negocio} onChange={e => setForm(f => ({ ...f, negocio: e.target.value }))}>{NEGOCIOS.map(n => <option key={n}>{n}</option>)}</FormSelect></FormField>
            <FormField label="Estado" style={{ flex: 1 }}><FormSelect value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}><option>Activo</option><option>En negociación</option><option>Inactivo</option></FormSelect></FormField>
          </FormRow>
          <FormField label="Marcas (separadas por coma)"><FormInput value={form.marcas} onChange={e => setForm(f => ({ ...f, marcas: e.target.value }))} placeholder="Ej: Honda, Hero" /></FormField>
          <FormField label="Categorías"><FormInput value={form.cats} onChange={e => setForm(f => ({ ...f, cats: e.target.value }))} placeholder="Ej: Motos, Repuestos, Lubricantes" /></FormField>
          <FormRow>
            <FormField label="Contacto" style={{ flex: 1 }}><FormInput value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} placeholder="Ejecutivo de cuenta" /></FormField>
            <FormField label="Descuento" style={{ flex: 1 }}><FormInput value={form.descuento} onChange={e => setForm(f => ({ ...f, descuento: e.target.value }))} placeholder="Ej: 18%" /></FormField>
          </FormRow>
          <FormField label="Plazo de pago"><FormInput value={form.plazo} onChange={e => setForm(f => ({ ...f, plazo: e.target.value }))} placeholder="Ej: 30 días" /></FormField>
        </Modal>
      </div>
    )
  }

  // Vista ficha proveedor
  return (
    <FichaLayout
      toolbar={<>
        <Btn variant="ghost" onClick={() => setFichaId(null)}>← Volver</Btn>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{proveedor?.nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{proveedor?.negocio} · <span style={{ color: proveedor?.estado === 'Activo' ? 'var(--color-success)' : 'var(--color-warning)' }}>{proveedor?.estado}</span></div>
        </div>
        <Btn variant="ghost" onClick={() => setModalReunion(true)}>👥 Nueva reunión</Btn>
        <Btn onClick={() => setModalTarea(true)}>+ Nueva tarea</Btn>
      </>}
      infoBar={<>
        {proveedor?.marcas && <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{proveedor.marcas.split(',').map(m => <TagNeutral key={m} label={m.trim()} />)}</div>}
        {proveedor?.contacto && <span>👤 {proveedor.contacto}</span>}
        {proveedor?.descuento && <span>💰 {proveedor.descuento} · {proveedor.plazo_pago}</span>}
        {proveedor?.categorias && <span>📦 {proveedor.categorias}</span>}
      </>}
      stats={<>
        <StatCard num={reuniones.length} label="Reuniones" />
        <StatCard num={venc} label="Vencidas" color={venc ? 'var(--color-danger)' : undefined} />
        <StatCard num={pend} label="Pendientes" />
        <StatCard num={tareas.filter(t => t.done).length} label="Completadas" color="var(--color-success)" />
      </>}
      fichaTabsEl={<FichaTabs tabs={FICHA_TABS} active={fichaTab} onChange={setFichaTab} />}
    >
      {fichaTab === 'hist' && (
        timeline.length === 0 ? (
          <EmptyState icon="🚚" title="Sin actividad registrada" subtitle="Registrá la primera reunión o tarea." />
        ) : (
          Object.entries(byMonth).map(([mes, evs]) => (
            <div key={mes} style={{ marginBottom: 12 }}>
              <MonthLabel label={mes} />
              {evs.map(e => e._tipo === 'reunion' ? (
                <div key={e.id} style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderLeft: '3px solid #9333ea', borderRadius: 10, padding: '11px 13px', marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: '#9333ea', marginBottom: 3 }}>Reunión</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{e.titulo}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 3 }}>📅 {fmtDate(e.fecha)}</div>
                  {e.notas && <div style={{ fontSize: 12, color: 'var(--color-text-2)', marginTop: 7, padding: '7px 10px', background: 'var(--color-surface-2)', borderRadius: 6, lineHeight: 1.5 }}>{e.notas}</div>}
                  {e._tareas?.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e._tareas.map(t => <TareaCard key={t.id} tarea={t} onToggle={() => toggleTarea(t)} onUpdate={u => setTareas(prev => prev.map(tk => tk.id === u.id ? u : tk))} onDelete={id => setTareas(prev => prev.filter(tk => tk.id !== id))} />)}
                    </div>
                  )}
                  <button onClick={() => { setFormTarea(f => ({ ...f, reunion_id: e.id })); setModalTarea(true) }}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9333ea', cursor: 'pointer', marginTop: 8, padding: '3px 6px', borderRadius: 5, background: 'none', border: 'none' }}>
                    + Agregar tarea a esta reunión
                  </button>
                </div>
              ) : (
                <div key={e.id} style={{ marginBottom: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-warning)', marginBottom: 3, paddingLeft: 2 }}>Tarea</div>
                  <TareaCard tarea={e} onToggle={() => toggleTarea(e)} onUpdate={u => setTareas(prev => prev.map(tk => tk.id === u.id ? u : tk))} onDelete={id => setTareas(prev => prev.filter(tk => tk.id !== id))} />
                </div>
              ))}
            </div>
          ))
        )
      )}

      {fichaTab === 'tareas' && (
        tareas.length === 0 ? (
          <EmptyState icon="📋" title="Sin tareas" subtitle="Creá la primera con el botón +" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {tareas.map(t => <TareaCard key={t.id} tarea={t} onToggle={() => toggleTarea(t)} onUpdate={u => setTareas(prev => prev.map(tk => tk.id === u.id ? u : tk))} onDelete={id => setTareas(prev => prev.filter(tk => tk.id !== id))} />)}
          </div>
        )
      )}

      {fichaTab === 'cond' && proveedor && (
        <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            ['Descuento', proveedor.descuento],
            ['Plazo de pago', proveedor.plazo_pago],
            ['Contacto', proveedor.contacto],
            ['Categorías', proveedor.categorias],
            ['Marcas', proveedor.marcas],
            ['Estado', proveedor.estado],
          ].map(([label, val]) => val ? (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 14px', borderBottom: '0.5px solid var(--color-border)', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-2)' }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{val}</span>
            </div>
          ) : null)}
        </div>
      )}

      {/* Modals */}
      <Modal open={modalReunion} onClose={() => setModalReunion(false)} title="Nueva reunión"
        footer={<><Btn variant="ghost" onClick={() => setModalReunion(false)}>Cancelar</Btn><Btn onClick={guardarReunion}>✓ Guardar</Btn></>}>
        <FormField label="Fecha"><FormInput type="date" value={formReun.fecha} onChange={e => setFormReun(f => ({ ...f, fecha: e.target.value }))} /></FormField>
        <FormField label="Título"><FormInput value={formReun.titulo} onChange={e => setFormReun(f => ({ ...f, titulo: e.target.value }))} placeholder="Ej: Revisión de precios julio" autoFocus /></FormField>
        <FormField label="Notas"><FormTextarea value={formReun.notas} onChange={e => setFormReun(f => ({ ...f, notas: e.target.value }))} rows={3} placeholder="¿Qué se habló? ¿Qué se acordó?" /></FormField>
      </Modal>

      <Modal open={modalTarea} onClose={() => { setModalTarea(false); setFormTarea(f => ({ ...f, reunion_id: '' })) }} title={`Nueva tarea — ${proveedor?.nombre}`}
        footer={<><Btn variant="ghost" onClick={() => setModalTarea(false)}>Cancelar</Btn><Btn onClick={guardarTarea}>✓ Crear tarea</Btn></>}>
        <FormField label="Título"><FormInput value={formTarea.titulo} onChange={e => setFormTarea(f => ({ ...f, titulo: e.target.value }))} placeholder="Describí la tarea..." autoFocus /></FormField>
        <FormField label="Prioridad"><PrioSelector value={formTarea.prioridad} onChange={v => setFormTarea(f => ({ ...f, prioridad: v }))} /></FormField>
        <FormRow>
          <FormField label="Fecha límite" style={{ flex: 1 }}><FormInput type="date" value={formTarea.fecha_limite} onChange={e => setFormTarea(f => ({ ...f, fecha_limite: e.target.value }))} /></FormField>
          <FormField label="Tipo" style={{ flex: 1 }}><FormInput value={formTarea.tipo} onChange={e => setFormTarea(f => ({ ...f, tipo: e.target.value }))} placeholder="Ej: Stock, Precios..." /></FormField>
        </FormRow>
        {reuniones.length > 0 && (
          <FormField label="Vincular a reunión (opcional)">
            <FormSelect value={formTarea.reunion_id} onChange={e => setFormTarea(f => ({ ...f, reunion_id: e.target.value }))}>
              <option value="">— Sin reunión —</option>
              {reuniones.map(r => <option key={r.id} value={r.id}>{fmtDate(r.fecha)} — {r.titulo}</option>)}
            </FormSelect>
          </FormField>
        )}
        <FormField label="Comentario (opcional)"><FormTextarea value={formTarea.comentario} onChange={e => setFormTarea(f => ({ ...f, comentario: e.target.value }))} rows={2} placeholder="Notas..." /></FormField>
      </Modal>
    </FichaLayout>
  )
}
