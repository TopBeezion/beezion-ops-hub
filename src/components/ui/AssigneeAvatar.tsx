interface AssigneeAvatarProps {
  name: string
  color?: string
  size?: 'sm' | 'md'
}

const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#fbbf24',
  Alec: '#818cf8',
  Paula: '#f472b6',
  'Jose Luis': '#4ade80',
}

export function AssigneeAvatar({ name, color, size = 'sm' }: AssigneeAvatarProps) {
  const bg = color || ASSIGNEE_COLORS[name] || '#6b7280'
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const sz = size === 'sm' ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-xs'

  return (
    <div
      className={`${sz} rounded-full flex items-center justify-center font-semibold shrink-0`}
      style={{ backgroundColor: `${bg}33`, color: bg, border: `1px solid ${bg}55` }}
      title={name}
    >
      {initials}
    </div>
  )
}
