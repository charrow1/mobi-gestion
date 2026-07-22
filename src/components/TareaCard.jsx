import { useState } from 'react'
import { format, isPast, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Checkbox, PrioDot } from './UI'
import Modal, { FormField, FormInput, FormTextarea, FormSelect, FormRow, PrioSelector } from './Modal'
import { Btn } from './UI'
import { supabase } from '../lib/supabase'

function fmtDate(d) {
  if (!d) return null
  try { return format(parseISO(d), "d MMM yyyy", { locale: es }) } catch { return d }
}

function isOverdue(date, done) {
  if (!date || done) return false
  try { return isPast(parseISO(date + 'T23:59:59')) } catch { return false }
}

export default function TareaCard({ tarea, onToggle, onUpdate, onDelete, showSource }) {
  const [expanded, setExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const ov = isOverdue(tarea.fecha_limite, tarea.done)

  async function addComment() {
    if (!comment.trim()) return
    setSaving(true)
    const coms = [...(tarea.comentarios || []), { text: comment.trim(), ts: new Date().toISOString() }]
    const { data } = await supabase.from('tareas').update({ comentarios: coms }).eq('id', tarea.id).select().single()
    if (data) { onUpdate(data); setComment('') }
    setSaving(false)
  }

  async function saveEdit() {
    const { data } = await supabase.from('tareas').update({
      titulo: form.titulo, prioridad: form.prioridad, fecha_limite: form.fecha_limite || null, tipo: form.tipo
    }).eq('id', tarea.id).select().single()
    if (data) { onUpdate(data); setEditOpen(false) }
  }

  async function deleteTarea() {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tareas').delete().eq('id', tarea.id)
    onDelete(tarea.id)
  }

  return (
    <>
      <div style={{ background: 'var(--color-surface-2)', border: `0.5px solid ${ov ? 'var(--color-danger-border)' : 'var(--color-border)'}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
          <div onClick={e => { e.stopPropagation(); onToggle() }}>
            <Checkbox checked={tarea.done} onChange={onToggle} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: tarea.done ? 'var(--color-text-3)' : 'var(--color-text)', textDecoration: tarea.done ? 'line-through' : 'none', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <PrioDot prio={tarea.prioridad} />
              {tarea.titulo}
              {tarea.tipo && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--color-surface)', border: '0.5px solid var(--color-border)', color: 'var(--color-text-2)' }}>{tarea.tipo}</span>}
              {showSource && tarea._source && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: 'var(--color-accent-bg)', border: '0.5px solid var(--color-accent-border)', color: 'var(--color-accent)' }}>{tarea._source}</span>}
            </div>
            <div style={{ fontSize: 11, color: ov ? 'var(--color-danger)' : 'var(--color-text-3)', marginTop: 2, display: 'flex', gap: 8 }}>
              {tarea.fecha_limite && <span>{ov ? '⚠ Vencida ' : '📅 '}{fmtDate(tarea.fecha_limite)}</span>}
              {tarea.comentarios?.length > 0 && <span>💬 {tarea.comentarios.length}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setForm({ titulo: tarea.titulo, prioridad: tarea.prioridad, fecha_limite: tarea.fecha_limite || '', tipo: tarea.tipo || '' }); setEditOpen(true) }}
              style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer', padding: '2px 4px' }}>✏️</button>
            <button onClick={deleteTarea}
              style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-3)', cursor: 'pointer', padding: '2px 4px' }}>🗑</button>
          </div>
        </div>

        {expanded && (
          <div style={{ borderTop: '0.5px solid var(--color-border)', padding: '10px 10px 10px 34px' }}>
            {(tarea.comentarios || []).map((c, i) => (
              <div key={i} style={{ background: 'var(--color-accent-bg)', borderRadius: 6, padding: '5px 9px', marginBottom: 5, fontSize: 12, borderLeft: '2px solid var(--color-accent)' }}>
                <div style={{ color: 'var(--color-text)' }}>{c.text}</div>
                {c.ts && <div style={{ fontSize: 10, color: 'var(--color-text-3)', marginTop: 2 }}>{format(parseISO(c.ts), "d MMM · HH:mm", { locale: es })}</div>}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Agregar comentario..."
                onKeyDown={e => e.key === 'Enter' && addComment()}
                style={{ flex: 1, padding: '5px 8px', border: '0.5px solid var(--color-border)', borderRadius: 6, fontSize: 12, outline: 'none', background: 'var(--color-bg)', color: 'var(--color-text)' }} />
              <Btn onClick={addComment} disabled={saving} style={{ padding: '5px 10px', fontSize: 11 }}>Enviar</Btn>
            </div>
          </div>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar tarea"
        footer={<><Btn variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Btn><Btn onClick={saveEdit}>Guardar</Btn></>}>
        <FormField label="Título">
          <FormInput value={form.titulo || ''} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
        </FormField>
        <FormField label="Prioridad">
          <PrioSelector value={form.prioridad} onChange={v => setForm(f => ({ ...f, prioridad: v }))} />
        </FormField>
        <FormRow>
          <FormField label="Fecha límite" style={{ flex: 1 }}>
            <FormInput type="date" value={form.fecha_limite || ''} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} />
          </FormField>
          <FormField label="Tipo" style={{ flex: 1 }}>
            <FormInput value={form.tipo || ''} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} placeholder="Ej: Stock..." />
          </FormField>
        </FormRow>
      </Modal>
    </>
  )
}
