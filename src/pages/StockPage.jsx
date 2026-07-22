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

      <div style={{ display: 'flex', background: 'var(--color-surface-2)', borderBottom: '0.5px
