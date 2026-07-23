import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { LOCALES, NEGOCIOS, TIPOS_TEMA } from '../lib/constants'
import { Btn, TagNeg, TagTipo, TagPerson, StatCard, EmptyState, MonthLabel, TagPicker } from '../components/UI'
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

export default function LocalesPage({ localActivo, vendedores, etiquetas }) {
  const negocios = etiquetas?.filter(e => e.categoria === 'negocio').map(e => e.nombre) || NEGOCIOS
  const tiposTema = etiquetas?.filter(e => e.categoria === 'tipo_tema').map(e => e.nombre) || TIPOS_TEMA
  const [temas, setTemas] = useState([])
  const [tareasVend, setTareasVend] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroNeg, setFiltroNeg] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [mostrarTareasVend, setMostrarTareasVend] = useState(true)
  const [modalTema, setModalTema] = useState(false)
  const [modalTarea, setModalTarea] = useState(null)
  const [formTema, setFormTema] = useState({ titulo: '', fecha: new Date().toISOString().slice(0, 10), notas: '', negocios: [], tipos: [], vendedor_nombre: '' })
  const [formTarea, setFormTarea] = useState({ titulo: '', prioridad: 'media', fecha_limite: '', tipo: '', comentario: '' })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: temasData }, { data: tareasData }] = await Promise.all([
      supabase.from('temas').select('*, tareas(*)').eq('local', localActivo).order('fecha', { ascending: false }),
      supabase.from('tareas').select('*, vendedores(nombre)').eq('local_vendedor', localActivo).eq('done', false).order('fecha_limite', { ascending: true })
    ])
    setTemas(temasData || [])
    setTareasVend(tareasData || [])
    setLoading(false)
  }, [localActivo])

  useEffect(() => { fetchData() }, [fetchData])

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

  async function toggleTareaVend(tarea) {
    const { data } = await supabase.from('tareas').update({ done: true }).eq('id', tarea.id).select().single()
    if (data) setTareasVend(prev => prev.filter(t => t.id !== tarea.id))
  }

  function updateTarea(temaId, updated) {
    setTemas(prev => prev.map(t => t.id === temaId ? { ...t, tareas: t.tareas.map(tk => tk.id === updated.id ? updated : tk) } : t))
  }

  function deleteTarea(temaId, tareaId) {
    setTemas(prev => prev.map(t => t.id === temaId ? { ...t, tareas: t.tareas.filter(tk => tk.id !== tareaId) } : t))
  }

  const allTareas = temas.flatMap(t => t.tareas || [])
  const venc = allTareas.filter(t => isOv(t.fecha_limite, t.done)).length
  const pend = allTareas.filter(t => !t.done).length
  const comp = allTareas.filter(t => t.done).length

  const allNegs = [...new Set(temas.flatMap(t => t.negocios || []))]
  const allTipos = [...new Set(temas.flatMap(t => t.tipos || []))]
  let filtered = temas
  if (filtroNeg) filtered = filtered.filter(t => (t.negocios || []).includes(filtroNeg))
  if (filtroTipo) filtered = filtered.filter(t => (t.tipos || []).includes(filtroTipo))

  // Construir línea de tiempo mezclando temas y tareas de vendedores
  const buildTimeline = () => {
    const items = [
      ...filtered.map(t => ({ tipo: 'tema', fecha: t.fecha, data: t })),
      ...(mostrarTareasVend ? tareasVend.map(t => ({ tipo: 'tarea_vend', fecha: t.fecha_limite || t.created_at?.slice(0, 10), data: t })) : [])
    ]
    items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    const byMonth = {}
    items.forEach(item => {
      const m = capitalize(fmtMes(item.fecha))
      if (!byMonth[m]) byMonth[m] = []
      byMonth[m].push(item)
    })
    return byMonth
  }

  const timeline = buildTimeline()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{localActivo}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{temas.length} temas · {pend} pendientes{venc ? ` · ⚠ ${venc} vencidas` : ''}</div>
        </div>
        <Btn onClick={() => setModalTema(true)}>+ Nuevo tema</Btn>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 24px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', flexShrink: 0 }}>
        <StatCard num={temas.length} label="Temas" />
        <StatCard num={venc} label="Vencidas" color={venc ? 'var(--color-danger)' : undefined} />
        <StatCard num={pend} label="Pendientes" />
        <StatCard num={comp} label="Completadas" color="var(--color-success)" />
      </div>

      {(allNegs.length > 0 || allTipos.length > 0 || tareasVend.length > 0) && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 24px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', overflowX: 'auto', alignItems: 'center', flexShrink: 0 }}>
          {allNegs.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>Negocio:</span>}
          {allNegs.map(n => (
            <button key={n} onClick={() => setFiltroNeg(filtroNeg === n ? '' : n)}
              style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${filtroNeg === n ? 'var(--color-accent-border)' : 'var(--color-border)'}`, fontSize: 12, cursor: 'pointer', background: filtroNeg === n ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: filtroNeg === n ? 'var(--color-accent)' : 'var(--color-text-2)', fontWeight: filtroNeg === n ? 500 : 400, whiteSpace: 'nowrap' }}>
              {n}
            </button>
          ))}
          {allNegs.length > 0 && allTipos.length > 0 && <div style={{ width: '0.5px', background: 'var(--color-border)', alignSelf: 'stretch', flexShrink: 0 }} />}
          {allTipos.length > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>Tipo:</span>}
          {allTipos.map(tp => (
            <button key={tp} onClick={() => setFiltroTipo(filtroTipo === tp ? '' : tp)}
              style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${filtroTipo === tp ? 'var(--color-accent-border)' : 'var(--color-border)'}`, fontSize: 12, cursor: 'pointer', background: filtroTipo === tp ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: filtroTipo === tp ? 'var(--color-accent)' : 'var(--color-text-2)', fontWeight: filtroTipo === tp ? 500 : 400, whiteSpace: 'nowrap' }}>
              {tp}
            </button>
          ))}
          {(filtroNeg || filtroTipo) && (
            <button onClick={() => { setFiltroNeg(''); setFiltroTipo('') }}
              style={{ padding: '3px 10px', borderRadius: 20, border: '0.5px solid var(--color-accent-border)', fontSize: 12, cursor: 'pointer', background: 'var(--color-accent-bg)', color: 'var(--color-accent)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              ✕ Limpiar
            </button>
          )}
          {tareasVend.length > 0 && <>
            <div style={{ width: '0.5px', background: 'var(--color-border)', alignSelf: 'stretch', flexShrink: 0 }} />
            <button onClick={() => setMostrarTareasVend(s => !s)}
              style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${mostrarTareasVend ? '#d8b4fe' : 'var(--color-border)'}`, fontSize: 12, cursor: 'pointer', background: mostrarTareasVend ? '#f3e8ff' : 'var(--color-surface-2)', color: mostrarTareasVend ? '#7e22ce' : 'var(--color-text-2)', fontWeight: mostrarTareasVend ? 500 : 400, whiteSpace: 'nowrap' }}>
              👤 Tareas de vendedores {mostrarTareasVend ? '✓' : ''}
            </button>
          </>}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-3)' }}>Cargando...</div>
        ) : Object.keys(timeline).length === 0 ? (
          <EmptyState icon="📝" title={temas.length ? 'Sin resultados para ese filtro' : 'Sin temas registrados'} subtitle="Creá el primer tema con el botón +" />
        ) : (
          Object.entries(timeline).map(([mes, items]) => (
            <div key={mes} style={{ marginBottom: 16 }}>
              <MonthLabel label={mes} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((item, i) => item.tipo === 'tema' ? (
                  <TemaEntry key={item.data.id} tema={item.data}
                    onAgregarTarea={() => setModalTarea(item.data.id)}
                    onToggleTarea={(t) => toggleTarea(item.data.id, t)}
                    onUpdateTarea={(u) => updateTarea(item.data.id, u)}
                    onDeleteTarea={(id) => deleteTarea(item.data.id, id)}
                  />
                ) : (
                  <TareaVendEntry key={item.data.id} tarea={item.data} onToggle={() => toggleTareaVend(item.data)} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

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
          <TagPicker options={negocios} selected={formTema.negocios} onToggle={v => setFormTema(f => ({ ...f, negocios: f.negocios.includes(v) ? f.negocios.filter(x => x !== v) : [...f.negocios, v] }))} />
        </FormField>
        <FormField label="Tipo de tema">
          <TagPicker options={tiposTema} selected={formTema.tipos} onToggle={v => setFormTema(f => ({ ...f, tipos: f.tipos.includes(v) ? f.tipos.filter(x => x !== v) : [...f.tipos, v] }))} />
        </FormField>
        <FormField label="Vendedor involucrado (opcional)">
          <FormSelect value={formTema.vendedor_nombre} onChange={e => setFormTema(f => ({ ...f, vendedor_nombre: e.target.value }))}>
            <option value="">— Ninguno —</option>
            {vendedores.map(v => <option key={v.id} value={v.nombre}>{v.nombre} ({v.local})</option>)}
          </FormSelect>
        </FormField>
      </Modal>

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
        <div style={{ width: 26, height: 26, minWidth: 26, borderRadius: 7, background: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📝</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)' }}>{tema.titulo}</div>
            {sl && <div style={{ fontSize: 12, color: sc, fontWeight: 500, whiteSpace: 'nowrap' }}>{sl}</div>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 3 }}>📅 {fmtDate(tema.fecha)}</div>
          {(tema.negocios?.length > 0 || tema.tipos?.length > 0 || tema.vendedor_nombre) && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
              {(tema.negocios || []).map(n => <TagNeg key={n} label={n} />)}
              {(tema.tipos || []).map(t => <TagTipo key={t} label={t} />)}
              {tema.vendedor_nombre && <TagPerson label={tema.vendedor_nombre} />}
            </div>
          )}
          {tema.notas && (
            <div style={{ fontSize: 13, color: 'var(--color-text-2)', background: 'var(--color-surface-2)', borderRadius: 6, padding: '8px 10px', marginTop: 8, lineHeight: 1.6, border: '0.5px solid var(--color-border)' }}>
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-accent)', cursor: 'pointer', marginTop: 8, padding: '3px 6px', borderRadius: 5, background: 'none', border: 'none' }}
            onMouseEnter={e => e.target.style.background = 'var(--color-accent-bg)'}
            onMouseLeave={e => e.target.style.background = 'none'}>
            + Agregar tarea
          </button>
        </div>
      </div>
    </div>
  )
}

function TareaVendEntry({ tarea, onToggle }) {
  const ov = isOv(tarea.fecha_limite, tarea.done)
  const vendNombre = tarea.vendedores?.nombre || '—'
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid #e9d5ff', borderLeft: '3px solid #9333ea', borderRadius: 10, padding: '10px 13px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#9333ea', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Tarea de vendedor</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <div onClick={onToggle}
          style={{ width: 16, height: 16, minWidth: 16, borderRadius: 4, border: '1.5px solid #c4b5fd', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 }}>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: tarea.prioridad === 'alta' ? '#E24B4A' : tarea.prioridad === 'baja' ? '#639922' : '#EF9F27', display: 'inline-block', flexShrink: 0 }} />
            {tarea.titulo}
          </div>
          <div style={{ fontSize: 12, color: ov ? 'var(--color-danger)' : 'var(--color-text-3)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {tarea.fecha_limite && <span>{ov ? '⚠ Vencida · ' : '📅 '}{fmtDate(tarea.fecha_limite)}</span>}
            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, padding: '1px 7px', borderRadius: 20, background: '#f3e8ff', color: '#7e22ce', border: '0.5px solid #d8b4fe', fontWeight: 500 }}>👤 {vendNombre}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
