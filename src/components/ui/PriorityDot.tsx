import type { Priority } from '../../types'
import { PRIORITY_COLORS } from '../../lib/constants'

interface PriorityDotProps {
  priority: Priority
}

export function PriorityDot({ priority }: PriorityDotProps) {
  return (
    <div
      className="w-2 h-2 rounded-full shrink-0"
      style={{ backgroundColor: PRIORITY_COLORS[priority] }}
      title={priority}
    />
  )
}
