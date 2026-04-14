import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Check, ChevronDown, X } from 'lucide-react'
import {
  useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask,
} from '../../hooks/useSubtasks'
import type { Subtask, TaskStatus } from '../../types'
import {
  STATUS_LABELS, STATUS_COLORS, STATUS_ORDER,
  ASSIGNEE_COLORS, TEAM_MEMBERS,
} from '../../lib/constants'

// Small popover hook
function usePop() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])
  return { open, setOpen, ref }
}

function StatusPicker({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
  const { open, setOpen, ref } = usePop()
  const color = STATUS_COLORS[value]
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 7px', borderRadius: 6, fontSize: 10, fontWeight: 700,
          backgroundColor: `${color}15`, color, border: `1px solid ${color}35`, cursor: 'pointer',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color }} />
        {STATUS_LABELS[value]}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 50,
          background: '#fff', border: '1px solid #E4E7F0', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', padding: 3, minWidth: 150,
        }}>
          {STATUS_ORDER.map(s => {
            const sc = STATUS_COLORS[s]
            return (
              <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: value === s ? `${sc}12` : 'transparent', textAlign: 'left', fontSize: 11, fontWeight: 600,
                color: value === s ? sc : '#1A1D27',
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: sc }} />
                {STATUS_LABELS[s]}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AssigneePicker({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  const { open, setOpen, ref } = usePop()
  const color = value ? (ASSIGNEE_COLORS[value] ?? '#6366F1') : '#9699B0'
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
        title={value ?? 'Asignar'}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: '50%', border: value ? 'none' : `1px dashed ${color}`,
          backgroundColor: value ? `${color}25` : '#F5F6FA',
          color: value ? color : '#9699B0',
          fontSize: 9, fontWeight: 800, cursor: 'pointer',
        }}
      >
        {value ? value.slice(0, 2).toUpperCase() : '?'}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 3px)', left: 0, zIndex: 50,
          background: '#fff', border: '1px solid #E4E7F0', borderRadius: 8,
          boxShadow: '0 6px 20px rgba(0,0,0,0.12)', padding: 3, minWidth: 170, maxHeight: 280, overflowY: 'auto',
        }}>
          <button type="button" onClick={() => { onChange(null); setOpen(false) }} style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%',
            padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: !value ? '#F5F6FA' : 'transparent', textAlign: 'left', fontSize: 11, color: '#9699B0', fontWeight: 600,
          }}>
            <X size={10} /> Sin asignar
          </button>
          {TEAM_MEMBERS.map(m => {
            const mc = ASSIGNEE_COLORS[m] ?? '#6366F1'
            return (
              <button key={m} type="button" onClick={() => { onChange(m); setOpen(false) }} style={{
                display: 'flex', alignItems: 'center', gap: 7, width: '100%',
                padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: value === m ? `${mc}12` : 'transparent', textAlign: 'left', fontSize: 11, fontWeight: 600,
                color: value === m ? mc : '#1A1D27',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: `${mc}25`, color: mc,
                  fontSize: 8, fontWeight: 800,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{m.slice(0, 2).toUpperCase()}</span>
                {m}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SubtaskRow({ subtask }: { subtask: Subtask }) {
  const update = useUpdateSubtask()
  const del = useDeleteSubtask()
  const [title, setTitle] = useState(subtask.title)
  const [editing, setEditing] = useState(false)

  useEffect(() => { setTitle(subtask.title) }, [subtask.title])

  const save = (fields: Partial<Subtask>) => {
    update.mutate({ id: subtask.id, task_id: subtask.task_id, ...fields })
  }

  const toggleDone = () => {
    save({ status: subtask.status === 'done' ? 'pendiente' : 'done' })
  }

  const isDone = subtask.status === 'done'
  const statusColor = STATUS_COLORS[subtask.status]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '22px 1fr auto auto auto 24px',
      alignItems: 'center', gap: 8,
      padding: '7px 10px', borderBottom: '1px solid #F0F2F8',
      backgroundColor: isDone ? '#FAFBFC' : '#fff',
    }}>
      {/* Check / status circle */}
      <button
        type="button"
        onClick={toggleDone}
        title={isDone ? 'Marcar pendiente' : 'Marcar hecho'}
        style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${isDone ? '#10b981' : statusColor}`,
          backgroundColor: isDone ? '#10b981' : 'transparent',
          cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
      >
        {isDone && <Check size={11} color="#fff" strokeWidth={3} />}
      </button>

      {/* Title */}
      {editing ? (
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={() => {
            setEditing(false)
            if (title.trim() && title !== subtask.title) save({ title: title.trim() })
            else setTitle(subtask.title)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') (e.currentTarget as HTMLInputElement).blur()
            if (e.key === 'Escape') { setTitle(subtask.title); setEditing(false) }
          }}
          style={{
            fontSize: 12, fontWeight: 500, padding: '4px 6px',
            border: '1px solid #6366F1', borderRadius: 5, outline: 'none',
            color: '#1A1D27', backgroundColor: '#fff', minWidth: 0,
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          style={{
            fontSize: 12, fontWeight: 500, padding: '4px 6px', borderRadius: 5,
            border: '1px solid transparent', background: 'transparent',
            color: isDone ? '#9699B0' : '#1A1D27',
            textDecoration: isDone ? 'line-through' : 'none',
            textAlign: 'left', cursor: 'text', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#E4E7F0' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent' }}
        >
          {subtask.title}
        </button>
      )}

      {/* Status */}
      <StatusPicker value={subtask.status} onChange={v => save({ status: v })} />

      {/* Assignee */}
      <AssigneePicker value={subtask.assignee} onChange={v => save({ assignee: v })} />

      {/* Due date */}
      <input
        type="date"
        value={subtask.due_date ?? ''}
        onChange={e => save({ due_date: e.target.value || null })}
        style={{
          fontSize: 10, fontWeight: 600, padding: '3px 5px', borderRadius: 5,
          border: '1px solid #E4E7F0', backgroundColor: subtask.due_date ? '#FFF9E6' : '#F5F6FA',
          color: subtask.due_date ? '#9A6700' : '#9699B0',
          width: 110,
        }}
      />

      {/* Delete */}
      <button
        type="button"
        onClick={() => {
          if (window.confirm(`¿Eliminar subtarea "${subtask.title}"?`)) {
            del.mutate({ id: subtask.id, task_id: subtask.task_id })
          }
        }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#9699B0', display: 'flex', padding: 3, borderRadius: 5,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = '#EF4444' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9699B0' }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export function SubtasksPanel({ taskId }: { taskId: string }) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId)
  const create = useCreateSubtask()
  const [newTitle, setNewTitle] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const doneCount = subtasks.filter(s => s.status === 'done').length
  const openCount = subtasks.length - doneCount

  const handleAdd = () => {
    const t = newTitle.trim()
    if (!t) return
    create.mutate(
      { task_id: taskId, title: t, position: subtasks.length },
      {
        onSuccess: () => {
          setNewTitle('')
          requestAnimationFrame(() => inputRef.current?.focus())
        },
      },
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
          Subtareas
          {subtasks.length > 0 && (
            <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99, backgroundColor: '#EEF2FF', color: '#6366F1' }}>
              {openCount} abierta{openCount === 1 ? '' : 's'} · {doneCount}/{subtasks.length}
            </span>
          )}
        </p>
      </div>

      <div style={{ border: '1px solid #E4E7F0', borderRadius: 9, overflow: 'hidden', backgroundColor: '#fff' }}>
        {/* Column headers */}
        {subtasks.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '22px 1fr auto auto auto 24px',
            alignItems: 'center', gap: 8,
            padding: '6px 10px',
            backgroundColor: '#F5F6FA', borderBottom: '1px solid #E4E7F0',
            fontSize: 9, fontWeight: 700, color: '#9699B0',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <span />
            <span>Nombre</span>
            <span>Status</span>
            <span style={{ textAlign: 'center' }}>Resp.</span>
            <span>Entrega</span>
            <span />
          </div>
        )}

        {isLoading ? (
          <div style={{ padding: 16, fontSize: 11, color: '#9699B0', textAlign: 'center' }}>Cargando…</div>
        ) : (
          subtasks.map(s => <SubtaskRow key={s.id} subtask={s} />)
        )}

        {/* Add row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', backgroundColor: '#FAFBFC',
        }}>
          <Plus size={14} style={{ color: '#9699B0', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
            }}
            placeholder="Agregar subtarea (Enter para guardar)"
            style={{
              flex: 1, fontSize: 12, padding: '5px 6px',
              border: 'none', outline: 'none', background: 'transparent', color: '#1A1D27',
            }}
          />
          {newTitle.trim() && (
            <button
              type="button"
              onClick={handleAdd}
              disabled={create.isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 10px', borderRadius: 6,
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                backgroundColor: '#6366F1', color: '#fff', border: 'none',
                opacity: create.isPending ? 0.6 : 1,
              }}
            >
              <Check size={11} /> Agregar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
