import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  color?: string
  variant?: 'solid' | 'subtle'
  size?: 'sm' | 'xs'
}

export function Badge({ children, color = '#6b7280', variant = 'subtle', size = 'sm' }: BadgeProps) {
  const baseStyle =
    variant === 'solid'
      ? { backgroundColor: color, color: '#0f0f0f' }
      : { backgroundColor: `${color}18`, color: color, border: `1px solid ${color}35` }

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold ${
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
      }`}
      style={baseStyle}
    >
      {children}
    </span>
  )
}
