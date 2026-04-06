import type { Area } from '../../types'
import { AREA_COLORS, AREA_LABELS } from '../../lib/constants'
import { Badge } from './Badge'

interface AreaBadgeProps {
  area: Area
  size?: 'sm' | 'xs'
}

export function AreaBadge({ area, size = 'sm' }: AreaBadgeProps) {
  return (
    <Badge color={AREA_COLORS[area]} size={size}>
      {AREA_LABELS[area]}
    </Badge>
  )
}
