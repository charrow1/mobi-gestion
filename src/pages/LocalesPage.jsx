import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { LOCALES, NEGOCIOS, TIPOS_TEMA } from '../lib/constants'
import { Btn, TagNeg, TagTipo, TagPerson, PrioDot, StatCard, EmptyState, MonthLabel, TagPicker, Checkbox } from '../components/UI'
import Modal, { FormField, FormInput, FormTextarea, FormSelect, FormRow, PrioSelector } from '../components/Modal'
import TareaCard from '../components/TareaCard'

function fmtDate(d) {
  if (!d) return ''
  try { return format(parseISO(d), "d MMM yyyy", { locale: es }) } catch { return d }
}
function fmtMes(d) {
  try { return format(parseISO(d + 'T12:00'), "MMMM yyyy", { locale: es }) } catch { return d }
}
function isOv(d, done) {
  if (!d || done) return false
  try { return new Date(d) < new Date(new Date().toDateString()) } catch { return false }
}
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }

export default function LocalesPage({ localActivo, vendedores }) {
  const [temas, setTemas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroNeg, setFiltroNeg] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modalTema, setModalTema] = useState(false)
  const [modalTarea, setModalTarea] = useState(null) // temaId
  const [formTema, setFormTema] = useState({ titulo: '', fecha: new Date().toISOString().slice(0, 10), notas: '', negocios: [], tipos: [], vendedor_nombre: '' })
  const [formTarea, setFormTarea] = useState({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '' })

  const fetchTemas = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('temas').select('*, tareas(*)').eq('local', localActivo).order('fecha', { ascending: false })
    setTemas(data || [])
    setLoading(false)
  }, [localActivo])

  useEffect(() => { fetchTemas() }, [fetchTemas])

  async function guardarTema() {
    if (!formTema.titulo.trim()) return
    const { data } = await supabase.from('temas').insert({
      local: localActivo, titulo: formTema.titulo.trim(), fecha: formTema.fecha,
      notas: formTema.notas.trim(), negocios: formTema.negocios, tipos: formTema.tipos,
      vendedor_nombre: formTema.vendedor_nombre || null
    }).select().single()
    if (data) {
      setTemas(prev => [{ ...data, tareas: [] }, ...prev])
      setModalTema(false)
      setFormTema({ titulo: '', fecha: new Date().toISOString().slice(0, 10), notas: '', negocios: [], tipos: [], vendedor_nombre: '' })
    }
  }

  async function guardarTarea() {
    if (!formTarea.titulo.trim()) return
    const { data } = await supabase.from('tareas').insert({
      tema_id: modalTarea, titulo: formTarea.titulo.trim(), prioridad: formTarea.prioridad,
      fecha_limite: formTarea.fecha_limite || null, tipo: formTarea.tipo.trim() || null,
      done: false, comentarios: formTarea.comentario.trim() ? [{ text: formTarea.comentario.trim(), ts: new Date().toISOString() }] : []
    }).select().single()
    if (data) {
      setTemas(prev => prev.map(t => t.id === modalTarea ? { ...t, tareas: [...(t.tareas || []), data] } : t))
      setModalTarea(null)
      setFormTarea({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '' })
    }
  }

  async function toggleTarea(temaId, tarea) {
    const { data } = await supabase.from('tareas').update({ done: !tarea.done }).eq('id', tarea.id).select().single()
    if (data) setTemas(prev => prev.map(t => t.id === temaId ? { ...t, tareas: t.tareas.map(tk => tk.id === data.id ? data : tk) } : t))
  }

  function updateTarea(temaId, updated) {
    setTemas(prev => prev.map(t => t.id === temaId ? { ...t, tareas: t.tareas.map(tk => tk.id === updated.id ? updated : tk) } : t))
  }

  function deleteTarea(temaId, tareaId) {
    setTemas(prev => prev.map(t => t.id === temaId ? { ...t, tareas: t.tareas.filter(tk => tk.id !== tareaId) } : t))
  }

  // Stats
  const allTareas = temas.flatMap(t => t.tareas || [])
  const venc = allTareas.filter(t => isOv(t.fecha_limite, t.done)).length
  const pend = allTareas.filter(t => !t.done).length
  const comp = allTareas.filter(t => t.done).length

  // Filtros
  const allNegs = [...new Set(temas.flatMap(t => t.negocios || []))]
  const allTipos = [...new Set(temas.flatMap(t => t.tipos || []))]
  let filtered = temas
  if (filtroNeg) filtered = filtered.filter(t => (t.negocios || []).includes(filtroNeg))
  if (filtroTipo) filtered = filtered.filter(t => (t.tipos || []).includes(filtroTipo))

  // Agrupar por mes
  const byMonth = {}
  filtered.forEach(t => {
    const m = capitalize(fmtMes(t.fecha))
    if (!byMonth[m]) byMonth[m] = []
    byMonth[m].push(t)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{localActivo}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{temas.length} temas · {pend} pendientes{venc ? ` · ⚠ ${venc} vencidas` : ''}</div>
        </div>
        <Btn onClick={() => setModalTema(true)}>+ Nuevo tema</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', flexShrink: 0 }}>
        <StatCard num={temas.length} label="Temas" />
        <StatCard num={venc} label="Vencidas" color={venc ? 'var(--color-danger)' : undefined} />
        <StatCard num={pend} label="Pendientes" />
        <StatCard num={comp} label="Completadas" color="var(--color-success)" />
      </div>

      {/* Filtros */}
      {(allNegs.length > 0 || allTipos.length > 0) && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', overflowX: 'auto', alignItems: 'center', flexShrink: 0 }}>
          {allNegs.length > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>Negocio:</span>}
          {allNegs.map(n => (
            <button key={n} onClick={() => setFiltroNeg(filtroNeg === n ? '' : n)}
              style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${filtroNeg === n ? 'var(--color-accent-border)' : 'var(--color-border)'}`, fontSize: 11, cursor: 'pointer', background: filtroNeg === n ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: filtroNeg === n ? 'var(--color-accent)' : 'var(--color-text-2)', fontWeight: filtroNeg === n ? 500 : 400, whiteSpace: 'nowrap' }}>
              {n}
            </button>
          ))}
          {allNegs.length > 0 && allTipos.length > 0 && <div style={{ width: '0.5px', background: 'var(--color-border)', alignSelf: 'stretch', flexShrink: 0 }} />}
          {allTipos.length > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>Tipo:</span>}
          {allTipos.map(tp => (
            <button key={tp} onClick={() => setFiltroTipo(filtroTipo === tp ? '' : tp)}
              style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${filtroTipo === tp ? 'var(--color-accent-border)' : 'var(--color-border)'}`, fontSize: 11, cursor: 'pointer', background: filtroTipo === tp ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: filtroTipo === tp ? 'var(--color-accent)' : 'var(--color-text-2)', fontWeight: filtroTipo === tp ? 500 : 400, whiteSpace: 'nowrap' }}>
              {tp}
            </button>
          ))}
          {(filtroNeg || filtroTipo) && (
            <button onClick={() => { setFiltroNeg(''); setFiltroTipo('') }}
              style={{ padding: '3px 10px', borderRadius: 20, border: '0.5px solid var(--color-accent-border)', fontSize: 11, cursor: 'pointer', background: 'var(--color-accent-bg)', color: 'var(--color-accent)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              ✕ Limpiar
            </button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-3)' }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="📝" title={temas.length ? 'Sin resultados para ese filtro' : 'Sin temas registrados'} subtitle="Creá el primer tema con el botón +" />
        ) : (
          Object.entries(byMonth).map(([mes, ts]) => (
            <div key={mes} style={{ marginBottom: 16 }}>
              <MonthLabel label={mes} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ts.map(tema => (
                  <TemaEntry key={tema.id} tema={tema}
                    onAgregarTarea={() => setModalTarea(tema.id)}
                    onToggleTarea={(t) => toggleTarea(tema.id, t)}
                    onUpdateTarea={(u) => updateTarea(tema.id, u)}
                    onDeleteTarea={(id) => deleteTarea(tema.id, id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal nuevo tema */}
      <Modal open={modalTema} onClose={() => setModalTema(false)} title={`Nuevo tema — ${localActivo}`}
        footer={<><Btn variant="ghost" onClick={() => setModalTema(false)}>Cancelar</Btn><Btn onClick={guardarTema}>✓ Guardar tema</Btn></>}>
        <FormField label="Título">
          <FormInput value={formTema.titulo} onChange={e => setFormTema(f => ({ ...f, titulo: e.target.value }))} placeholder="¿De qué se trató?" autoFocus />
        </FormField>
        <FormField label="Fecha">
          <FormInput type="date" value={formTema.fecha} onChange={e => setFormTema(f => ({ ...f, fecha: e.target.value }))} />
        </FormField>
        <FormField label="Notas">
          <FormTextarea value={formTema.notas} onChange={e => setFormTema(f => ({ ...f, notas: e.target.value }))} rows={3} placeholder="¿Qué se habló? ¿Qué pasó?" />
        </FormField>
        <FormField label="Negocio">
          <TagPicker options={NEGOCIOS} selected={formTema.negocios} onToggle={v => setFormTema(f => ({ ...f, negocios: f.negocios.includes(v) ? f.negocios.filter(x => x !== v) : [...f.negocios, v] }))} />
        </FormField>
        <FormField label="Tipo de tema">
          <TagPicker options={TIPOS_TEMA} selected={formTema.tipos} onToggle={v => setFormTema(f => ({ ...f, tipos: f.tipos.includes(v) ? f.tipos.filter(x => x !== v) : [...f.tipos, v] }))} />
        </FormField>
        <FormField label="Vendedor involucrado (opcional)">
          <FormSelect value={formTema.vendedor_nombre} onChange={e => setFormTema(f => ({ ...f, vendedor_nombre: e.target.value }))}>
            <option value="">— Ninguno —</option>
            {vendedores.map(v => <option key={v.id} value={v.nombre}>{v.nombre} ({v.local})</option>)}
          </FormSelect>
        </FormField>
      </Modal>

      {/* Modal nueva tarea */}
      <Modal open={!!modalTarea} onClose={() => setModalTarea(null)} title="Nueva tarea"
        footer={<><Btn variant="ghost" onClick={() => setModalTarea(null)}>Cancelar</Btn><Btn onClick={guardarTarea}>✓ Crear tarea</Btn></>}>
        <FormField label="Título">
          <FormInput value={formTarea.titulo} onChange={e => setFormTarea(f => ({ ...f, titulo: e.target.value }))} placeholder="Describí la tarea..." autoFocus />
        </FormField>
        <FormField label="Prioridad">
          <PrioSelector value={formTarea.prioridad} onChange={v => setFormTarea(f => ({ ...f, prioridad: v }))} />
        </FormField>
        <FormRow>
          <FormField label="Fecha límite" style={{ flex: 1 }}>
            <FormInput type="date" value={formTarea.fecha_limite} onChange={e => setFormTarea(f => ({ ...f, fecha_limite: e.target.value }))} />
          </FormField>
          <FormField label="Tipo" style={{ flex: 1 }}>
            <FormInput value={formTarea.tipo} onChange={e => setFormTarea(f => ({ ...f, tipo: e.target.value }))} placeholder="Ej: Stock, RRHH..." />
          </FormField>
        </FormRow>
        <FormField label="Comentario inicial (opcional)">
          <FormTextarea value={formTarea.comentario} onChange={e => setFormTarea(f => ({ ...f, comentario: e.target.value }))} rows={2} placeholder="Notas sobre esta tarea..." />
        </FormField>
      </Modal>
    </div>
  )
}

function TemaEntry({ tema, onAgregarTarea, onToggleTarea, onUpdateTarea, onDeleteTarea }) {
  const tareas = tema.tareas || []
  const venc = tareas.filter(t => isOv(t.fecha_limite, t.done)).length
  const pend = tareas.filter(t => !t.done).length
  const sc = venc ? 'var(--color-danger)' : pend ? 'var(--color-warning)' : 'var(--color-text-3)'
  const sl = venc ? `⚠ ${venc} vencida${venc > 1 ? 's' : ''}` : pend ? `${pend} pendiente${pend > 1 ? 's' : ''}` : tareas.length ? '✓ Al día' : ''

  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)', borderRadius: 10, padding: '11px 13px' }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 26, height: 26, minWidth: 26, borderRadius: 7, background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>📝</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{tema.titulo}</div>
            {sl && <div style={{ fontSize: 11, color: sc, fontWeight: 500, whiteSpace: 'nowrap' }}>{sl}</div>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 3 }}>📅 {fmtDate(tema.fecha)}</div>
          {(tema.negocios?.length > 0 || tema.tipos?.length > 0 || tema.vendedor_nombre) && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
              {(tema.negocios || []).map(n => <TagNeg key={n} label={n} />)}
              {(tema.tipos || []).map(t => <TagTipo key={t} label={t} />)}
              {tema.vendedor_nombre && <TagPerson label={tema.vendedor_nombre} />}
            </div>
          )}
          {tema.notas && (
            <div style={{ fontSize: 12, color: 'var(--color-text-2)', background: 'var(--color-surface-2)', borderRadius: 6, padding: '8px 10px', marginTop: 8, lineHeight: 1.5, border: '0.5px solid var(--color-border)' }}>
              {tema.notas}
            </div>
          )}
          {tareas.length > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {tareas.map(t => (
                <TareaCard key={t.id} tarea={t} onToggle={() => onToggleTarea(t)} onUpdate={onUpdateTarea} onDelete={onDeleteTarea} />
              ))}
            </div>
          )}
          <button onClick={onAgregarTarea}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-accent)', cursor: 'pointer', marginTop: 8, padding: '3px 6px', borderRadius: 5, background: 'none', border: 'none' }}
            onMouseEnter={e => e.target.style.background = 'var(--color-accent-bg)'}
            onMouseLeave={e => e.target.style.background = 'none'}>
            + Agregar tarea
          </button>
        </div>
      </div>
    </div>
  )
}
