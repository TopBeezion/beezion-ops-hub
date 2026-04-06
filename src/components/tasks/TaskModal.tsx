import { useState } from 'react'
import type { FormEvent } from 'react'
import { X } from 'lucide-react'
import { useClients } from '../../hooks/useClients'
import { useCreateTask } from '../../hooks/useTasks'
import type { Area, Priority, TaskStatus, TaskTipo } from '../../types'

interface TaskModalProps {
  onClose: () => void
  defaultClientId?: string
}

export function TaskModal({ onClose, defaultClientId }: TaskModalProps) {
  const { data: clients } = useClients()
  const createTask = useCreateTask()

  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState(defaultClientId || '')
  const [area, setArea] = useState<Area>('copy')
  const [assignee, setAssignee] = useState('Alejandro')
  const [priority, setPriority] = useState<Priority>('media')
  const [status, setStatus] = useState<TaskStatus>('pendiente')
  const [week, setWeek] = useState(1)
  const [tipo, setTipo] = useState<TaskTipo>('nuevo')
  const [problema, setProblema] = useState('')

  // Role hints shown next to each assignee
  const ASSIGNEE_ROLES: Record<string, string> = {
    Alejandro: 'CEO · Copy & Estrategia',
    Alec: 'COO · Head Tech & Paid Media',
    Paula: 'Aux. Marketing · Producción · Diseño LM · Admin',
    'Jose Luis': 'Trafficker Digital',
    'Editor 1': 'Edición de Video',
    'Editor 2': 'Edición de Video',
    'Editor 3': 'Edición de Video',
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await createTask.mutateAsync({
      title,
      client_id: clientId || undefined,
      area,
      assignee,
      priority,
      status,
      week,
      tipo,
      problema: problema || undefined,
      source: 'manual',
    })
    onClose()
  }

  const inputStyle = {
    backgroundColor: '#191c35',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#f0f2ff',
  }

  const labelStyle = { color: '#a0a6cc' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative h-full w-full max-w-md flex flex-col overflow-hidden"
        style={{
          backgroundColor: '#0d0e17',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.6)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <h2 className="text-sm font-medium" style={{ color: '#f0f2ff' }}>
            Nueva tarea
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[rgba(255,255,255,0.07)] transition-colors">
            <X size={15} style={{ color: '#a0a6cc' }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Título</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={inputStyle}
              placeholder="Describe la tarea..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Cliente</label>
              <select
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                <option value="">Sin cliente</option>
                {clients?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Área</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value as Area)}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                <option value="copy">Copy</option>
                <option value="trafico">Tráfico</option>
                <option value="tech">Tech</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Responsable</label>
              <select
                value={assignee}
                onChange={e => setAssignee(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                {['Alejandro', 'Alec', 'Paula', 'Jose Luis', 'Editor 1', 'Editor 2', 'Editor 3'].map(name => (
                  <option key={name} value={name}>{name} — {ASSIGNEE_ROLES[name]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Prioridad</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_progreso">En Progreso</option>
                <option value="revision">En Revisión</option>
                <option value="completado">Completado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Semana</label>
              <select
                value={week}
                onChange={e => setWeek(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md text-sm outline-none"
                style={inputStyle}
              >
                {[1, 2, 3, 4].map(w => (
                  <option key={w} value={w}>Semana {w}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Tipo</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value as TaskTipo)}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={inputStyle}
            >
              <option value="nuevo">Nuevo</option>
              <option value="pendiente_anterior">Pendiente anterior</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Problema que resuelve</label>
            <input
              value={problema}
              onChange={e => setProblema(e.target.value)}
              className="w-full px-3 py-2 rounded-md text-sm outline-none"
              style={inputStyle}
              placeholder="Ej: Show rate Book Demos bajo"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-md text-sm transition-colors hover:bg-[rgba(255,255,255,0.07)]"
              style={{ border: '1px solid rgba(255,255,255,0.07)', color: '#a0a6cc' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="flex-1 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              style={{
            background: 'linear-gradient(135deg, #f5a623, #ff7c1a)',
            color: '#0c0e1a',
            boxShadow: '0 0 16px rgba(245,166,35,0.3)',
          }}
            >
              {createTask.isPending ? 'Creando...' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
