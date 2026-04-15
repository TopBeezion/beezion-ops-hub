import type { TaskStatus } from '../../types'
import { STATUS_COLORS, STATUS_LABELS } from '../../lib/constants'

interface StatusSelectProps {
  status: TaskStatus
  onChange: (status: TaskStatus) => void
  disabled?: boolean
}

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'en_progreso', 'revision', 'hecho']

export function StatusSelect({ status, onChange, disabled }: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={e => onChange(e.target.value as TaskStatus)}
      disabled={disabled}
      className="text-[10px] px-2 py-1 rounded-lg border-0 outline-none cursor-pointer font-semibold"
      style={{
        backgroundColor: `${STATUS_COLORS[status]}18`,
        color: STATUS_COLORS[status],
        border: `1px solid ${STATUS_COLORS[status]}35`,
      }}
    >
      {STATUS_OPTIONS.map(s => (
        <option key={s} value={s} style={{ backgroundColor: '#1c1c1c', color: '#f5f5f5' }}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
