import type { Client } from '../../types'
import { Badge } from './Badge'

interface ClientBadgeProps {
  client?: Client | null
  size?: 'sm' | 'xs'
}

export function ClientBadge({ client, size = 'sm' }: ClientBadgeProps) {
  if (!client) return <span className="text-xs" style={{ color: '#6b7280' }}>—</span>
  return (
    <Badge color={client.color} size={size}>
      {client.name}
    </Badge>
  )
}
