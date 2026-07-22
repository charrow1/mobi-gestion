import { useState, useEffect, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { LOCALES, NEGOCIOS } from '../lib/constants'
import { Btn, StatCard, EmptyState } from '../components/UI'
import Modal, { FormField, FormInput, FormTextarea, FormSelect, FormRow } from '../components/Modal'

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmt(n) { return '$' + Math.abs(n).toLocaleString('es-AR') }
function fmtDate(d) { try { return format(parseISO(d), "d MMM yyyy", { locale: es }) } catch { return d } }

export default function StockPage({ etiquetas }) {
  const [ajustes, setAjustes] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('detalle')
  const [mesIdx, setMesIdx] = useState(new Date().getMonth())
  const [año, setAño] = useState(new Date().getFullYear())
  const [filtroLocal, setFiltroLocal] = useState('')
  const [filtroNeg, setFiltroNeg] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [modal, setModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [tipoSel, setTipoSel] = useState('perdida')
  const [form, setForm] = useState({ local: LOCALES[0], negocio: '', sku: '', descripcion: '', cantidad: '', costo_reposicion: '', observaciones: '', fecha: new Date().toISOString().slice(0, 10) })

  const negocios = etiquetas?.filter(e => e.categoria === 'negocio').map(e => e.nombre) || NEGOCIOS

  const fetchAjustes = useCallback(async () => {
    setLoading(true)
    const desde = `${año}-${String(mesIdx + 1).padStart(2, '0')}-01`
    const hasta = `${año}-${String(mesIdx + 1).padStart(2, '0')}-31`
    const { data } = await supabase.from('ajustes_stock').select('*')
      .gte('fecha', desde).lte('fecha', hasta)
      .order('fecha', { ascending: false })
    setAjustes(data || [])
    setLoading(false)
  }, [mesIdx, año])

  useEffect(() => { fetchAjustes() }, [fetchAjustes])

  function cambiarMes(d) {
    let nm = mesIdx + d, na = año
    if (nm > 11) { nm = 0; na++ }
    if (nm < 0) { nm = 11; na-- }
    setMesIdx(nm); setAño(na)
  }

  const filtered = ajustes.filter(a => {
    if (filtroLocal && a.local !== filtroLocal) return false
    if (filtroNeg && a.negocio !== filtroNeg) return false
    if (filtroTipo && a.tipo !== filtroTipo) return false
    return true
  })

  const perdidas = filtered.filter(a => a.tipo === 'perdida')
  const sobrantes = filtered.filter(a => a.tipo === 'sobrante')
  const totalPerd = perdidas.reduce((s, a) => s + Number(a.total), 0)
  const totalSob = sobrantes.reduce((s, a) => s + Number(a.total), 0)
  const neto = totalSob - totalPerd

  function openNew() {
    setEditId(null); setTipoSel('perdida')
    setForm({ local: LOCALES[0], negocio: negocios[0] || '', sku: '', descripcion: '', cantidad: '', costo_reposicion: '', observaciones: '', fecha: new Date().toISOString().slice(0, 10) })
    setModal(true)
  }

  function openEdit(a) {
    setEditId(a.id); setTipoSel(a.tipo)
    setForm({ local: a.local, negocio: a.negocio, sku: a.sku, descripcion: a.descripcion, cantidad: a.cantidad, costo_reposicion: a.costo_reposicion, observaciones: a.observaciones || '', fecha: a.fecha })
    setModal(true)
  }

  async function guardar() {
    const { local, negocio, sku, descripcion, fecha } = form
    const cantidad = parseInt(form.cantidad)
    const costo_reposicion = parseFloat(form.costo_reposicion)
    if (!sku.trim() || !descripcion.trim() || !cantidad || !costo_reposicion) return
    const payload = { tipo: tipoSel, local, negocio, sku: sku.trim(), descripcion: descripcion.trim(), cantidad, costo_reposicion, total: cantidad * costo_reposicion, observaciones: form.observaciones.trim(), fecha }
    if (editId) {
      const { data } = await supabase.from('ajustes_stock').update(payload).eq('id', editId).select().single()
      if (data) setAjustes(prev => prev.map(a => a.id === data.id ? data : a))
    } else {
      const { data } = await supabase.from('ajustes_stock').insert(payload).select().single()
      if (data) setAjustes(prev => [data, ...prev])
    }
    setModal(false)
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este ajuste?')) return
    await supabase.from('ajustes_stock').delete().eq('id', id)
    setAjustes(prev => prev.filter(a => a.id !== id))
  }

  const totalImpacto = form.cantidad && form.costo_reposicion ? parseInt(form.cantidad) * parseFloat(form.costo_reposicion) : 0

  const localesUniq = [...new Set(ajustes.map(a => a.local))]
  const negociosUniq = [...new Set(ajustes.map(a => a.negocio))]
  const totalPerdAll = ajustes.filter(a => a.tipo === 'perdida').reduce((s, a) => s + Number(a.total), 0)
  const totalSobAll = ajustes.filter(a => a.tipo === 'sobrante').reduce((s, a) => s + Number(a.total), 0)
  const netoAll = totalSobAll - totalPerdAll

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-surface)', borderBottom: '0.5px solid var(--color-border)', flexShrink: 0, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500 }}>Ajustes de stock</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{filtered.length} ajustes · impacto neto <span style={{ color: neto >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 500 }}>{neto >= 0 ? '+' : '−'}{fmt(Math.abs(neto))}</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => cambiarMes(-1)} style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--color-text-2)' }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 500, minWidth: 100, textAlign: 'center' }}>{MESES[mesIdx]} {año}</span>
          <button onClick={() => cambiarMes(1)} style={{ background: 'none', border: '0.5px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--color-text-2)' }}>›</button>
        </div>
        <Btn onClick={openNew}>+ Nuevo ajuste</Btn>
      </div>

      <div style={{ display: 'flex', background: 'var(--color-surface-2)', borderBottom: '0.5px solid var(--color-border)', padding: '0 20px', flexShrink: 0 }}>
        {[['detalle', 'Detalle de ajustes'], ['resumen', 'Resumen mensual']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '7px 14px', fontSize: 12, fontWeight: 500, color: tab === key ? 'var(--color-accent)' : 'var(--color-text-3)', border: 'none', background: 'none', borderBottom: `2px solid ${tab === key ? 'var(--color-accent)' : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'detalle' && <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, padding: '10px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', flexShrink: 0 }}>
          <StatCard num={filtered.length} label="Total ajustes" />
          <StatCard num={perdidas.length} label="Pérdidas" color={perdidas.length ? 'var(--color-danger)' : undefined} />
          <StatCard num={sobrantes.length} label="Sobrantes" color={sobrantes.length ? 'var(--color-success)' : undefined} />
          <StatCard num={(neto >= 0 ? '+' : '−') + ' ' + fmt(Math.abs(neto))} label="Impacto neto" color={neto >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} />
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '8px 20px', borderBottom: '0.5px solid var(--color-border)', background: 'var(--color-surface-2)', overflowX: 'auto', alignItems: 'center', flexShrink: 0 }}>
          <FiltroGrupo label="Local" opciones={['', ...LOCALES]} valor={filtroLocal} onChange={setFiltroLocal} labels={['Todos', ...LOCALES]} />
          <div style={{ width: '0.5px', background: 'var(--color-border)', alignSelf: 'stretch', flexShrink: 0 }} />
          <FiltroGrupo label="Negocio" opciones={['', ...negocios]} valor={filtroNeg} onChange={setFiltroNeg} labels={['Todos', ...negocios]} />
          <div style={{ width: '0.5px', background: 'var(--color-border)', alignSelf: 'stretch', flexShrink: 0 }} />
          <FiltroGrupo label="Tipo" opciones={['', 'perdida', 'sobrante']} valor={filtroTipo} onChange={setFiltroTipo} labels={['Todos', 'Pérdida', 'Sobrante']} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-3)' }}>Cargando...</div>
            : filtered.length === 0 ? <EmptyState icon="📦" title="Sin ajustes" subtitle="Registrá el primer ajuste con el botón +" />
            : filtered.map(a => <AjusteRow key={a.id} ajuste={a} onEdit={() => openEdit(a)} onDelete={() => eliminar(a.id)} />)
          }
        </div>
      </>}

      {tab === 'resumen' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ResumenTabla titulo={`Por local — ${MESES[mesIdx]} ${año}`} grupos={localesUniq} ajustes={ajustes} campo="local" />
          <ResumenTabla titulo={`Por negocio — ${MESES[mesIdx]} ${año}`} grupos={negociosUniq} ajustes={ajustes} campo="negocio" />
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? 'Editar ajuste' : 'Nuevo ajuste de stock'}
        footer={<><Btn variant="ghost" onClick={() => setModal(false)}>Cancelar</Btn><Btn onClick={guardar}>✓ Guardar</Btn></>}>
        <FormField label="Tipo de ajuste">
          <div style={{ display: 'flex', gap: 6 }}>
            {[['perdida', 'Pérdida', '#FEF2F2', '#FCA5A5', '#991B1B'], ['sobrante', 'Sobrante', '#EAF3DE', '#C0DD97', '#3B6D11']].map(([key, label, bg, border, color]) => (
              <button key={key} onClick={() => setTipoSel(key)}
                style={{ flex: 1, padding: '8px', border: `0.5px solid ${tipoSel === key ? border : 'var(--color-border)'}`, borderRadius: 8, fontSize: 12, fontWeight: tipoSel === key ? 600 : 400, cursor: 'pointer', background: tipoSel === key ? bg : 'var(--color-surface-2)', color: tipoSel === key ? color : 'var(--color-text-2)', transition: 'all .1s' }}>
                {label}
              </button>
            ))}
          </div>
        </FormField>
        <FormRow>
          <FormField label="Local" style={{ flex: 1 }}>
            <FormSelect value={form.local} onChange={e => setForm(f => ({ ...f, local: e.target.value }))}>
              {LOCALES.map(l => <option key={l}>{l}</option>)}
            </FormSelect>
          </FormField>
          <FormField label="Negocio" style={{ flex: 1 }}>
            <FormSelect value={form.negocio} onChange={e => setForm(f => ({ ...f, negocio: e.target.value }))}>
              {negocios.map(n => <option key={n}>{n}</option>)}
            </FormSelect>
          </FormField>
        </FormRow>
        <FormField label="Fecha">
          <FormInput type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
        </FormField>
        <FormField label="SKU">
          <FormInput value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="Ej: HON-WAVE110-R" autoFocus />
        </FormField>
        <FormField label="Descripción del producto">
          <FormInput value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Ej: Honda Wave 110S Roja" />
        </FormField>
        <FormRow>
          <FormField label="Cantidad" style={{ flex: 1 }}>
            <FormInput type="number" min="1" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} placeholder="Ej: 2" />
          </FormField>
          <FormField label="Costo de reposición ($)" style={{ flex: 1 }}>
            <FormInput type="number" min="0" value={form.costo_reposicion} onChange={e => setForm(f => ({ ...f, costo_reposicion: e.target.value }))} placeholder="Ej: 450000" />
          </FormField>
        </FormRow>
        {totalImpacto > 0 && (
          <div style={{ background: 'var(--color-surface-2)', border: '0.5px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)' }}>{form.cantidad} u. × {fmt(parseFloat(form.costo_reposicion))} =</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: tipoSel === 'perdida' ? 'var(--color-danger)' : 'var(--color-success)', marginTop: 3 }}>
              {tipoSel === 'perdida' ? '−' : '+'} {fmt(totalImpacto)}
            </div>
          </div>
        )}
        <FormField label="Observaciones (opcional)">
          <FormTextarea value={form.observaciones} onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} rows={2} placeholder="Motivo del ajuste, responsable..." />
        </FormField>
      </Modal>
    </div>
  )
}

function AjusteRow({ ajuste: a, onEdit, onDelete }) {
  const esPerd = a.tipo === 'perdida'
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, whiteSpace: 'nowrap', border: '0.5px solid', flexShrink: 0, marginTop: 2, background: esPerd ? '#FEF2F2' : '#EAF3DE', color: esPerd ? '#991B1B' : '#3B6D11', borderColor: esPerd ? '#FCA5A5' : '#C0DD97' }}>
        {esPerd ? 'Pérdida' : 'Sobrante'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', letterSpacing: '0.05em', marginBottom: 2 }}>{a.sku}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{a.descripcion}</div>
        <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>📍 {a.local}</span>
          <span>🏷 {a.negocio}</span>
          <span>📦 {a.cantidad} u. × {fmt(a.costo_reposicion)}</span>
          <span>📅 {fmtDate(a.fecha)}</span>
          {a.observaciones && <span style={{ color: 'var(--color-text-2)' }}>· {a.observaciones}</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: esPerd ? 'var(--color-danger)' : 'var(--color-success)' }}>
          {esPerd ? '−' : '+'}{fmt(a.total)}
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'flex-end' }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer', padding: '2px 4px' }}>✏️</button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer', padding: '2px 4px' }}>🗑</button>
        </div>
      </div>
    </div>
  )
}

function ResumenTabla({ titulo, grupos, ajustes, campo }) {
  const totalPerd = ajustes.filter(a => a.tipo === 'perdida').reduce((s, a) => s + Number(a.total), 0)
  const totalSob = ajustes.filter(a => a.tipo === 'sobrante').reduce((s, a) => s + Number(a.total), 0)
  const neto = totalSob - totalPerd
  const col = { fontSize: 11, padding: '8px 14px', borderBottom: '0.5px solid var(--color-border)' }
  const head = { ...col, fontSize: 10, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', background: 'var(--color-surface-2)' }
  return (
    <div style={{ background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--color-border)', fontSize: 13, fontWeight: 500 }}>{titulo}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...head, textAlign: 'left' }}>Nombre</th>
            <th style={{ ...head, textAlign: 'center', width: 70 }}>Ajustes</th>
            <th style={{ ...head, textAlign: 'right', width: 110 }}>Pérdidas</th>
            <th style={{ ...head, textAlign: 'right', width: 110 }}>Sobrantes</th>
            <th style={{ ...head, textAlign: 'right', width: 110 }}>Neto</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map(g => {
            const ga = ajustes.filter(a => a[campo] === g)
            const gp = ga.filter(a => a.tipo === 'perdida').reduce((s, a) => s + Number(a.total), 0)
            const gs = ga.filter(a => a.tipo === 'sobrante').reduce((s, a) => s + Number(a.total), 0)
            const gn = gs - gp
            return (
              <tr key={g}>
                <td style={{ ...col, fontWeight: 500 }}>{g}</td>
                <td style={{ ...col, textAlign: 'center', color: 'var(--color-text-3)' }}>{ga.length}</td>
                <td style={{ ...col, textAlign: 'right', color: gp ? 'var(--color-danger)' : 'var(--color-text-3)' }}>{gp ? '−' + fmt(gp) : '—'}</td>
                <td style={{ ...col, textAlign: 'right', color: gs ? 'var(--color-success)' : 'var(--color-text-3)' }}>{gs ? '+' + fmt(gs) : '—'}</td>
                <td style={{ ...col, textAlign: 'right', fontWeight: 500, color: gn >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{gn >= 0 ? '+' : '−'}{fmt(Math.abs(gn))}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: 'var(--color-surface-2)' }}>
            <td style={{ ...col, fontWeight: 600, borderTop: '0.5px solid var(--color-border)' }}>Total general</td>
            <td style={{ ...col, textAlign: 'center', fontWeight: 600, borderTop: '0.5px solid var(--color-border)' }}>{ajustes.length}</td>
            <td style={{ ...col, textAlign: 'right', fontWeight: 600, color: 'var(--color-danger)', borderTop: '0.5px solid var(--color-border)' }}>{totalPerd ? '−' + fmt(totalPerd) : '—'}</td>
            <td style={{ ...col, textAlign: 'right', fontWeight: 600, color: 'var(--color-success)', borderTop: '0.5px solid var(--color-border)' }}>{totalSob ? '+' + fmt(totalSob) : '—'}</td>
            <td style={{ ...col, textAlign: 'right', fontWeight: 700, fontSize: 13, color: neto >= 0 ? 'var(--color-success)' : 'var(--color-danger)', borderTop: '0.5px solid var(--color-border)' }}>{neto >= 0 ? '+' : '−'}{fmt(Math.abs(neto))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function FiltroGrupo({ label, opciones, valor, onChange, labels }) {
  return (
    <>
      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-3)', whiteSpace: 'nowrap' }}>{label}:</span>
      {opciones.map((op, i) => (
        <button key={op} onClick={() => onChange(op)}
          style={{ padding: '3px 10px', borderRadius: 20, border: `0.5px solid ${valor === op ? 'var(--color-accent-border)' : 'var(--color-border)'}`, fontSize: 11, cursor: 'pointer', background: valor === op ? 'var(--color-accent-bg)' : 'var(--color-surface-2)', color: valor === op ? 'var(--color-accent)' : 'var(--color-text-2)', fontWeight: valor === op ? 500 : 400, whiteSpace: 'nowrap' }}>
          {labels[i]}
        </button>
      ))}
    </>
  )
}
