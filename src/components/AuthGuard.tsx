import type { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  // Auth desactivado para prueba local
  return <>{children}</>
}
