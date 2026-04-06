import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useTaskModal } from '../../hooks/useTaskModal'
import { useRealtimeTasks } from '../../hooks/useTasks'
import { TaskModal } from '../tasks/TaskModal'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/backlog': 'Backlog',
  '/kanban': 'Kanban',
  '/timeline': 'Timeline',
  '/settings': 'Configuración',
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { isOpen, open, close } = useTaskModal()
  useRealtimeTasks()

  const title =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/clients/') ? 'Cliente' : 'Beezion Ops')

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#0c0e1a' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header title={title} onNewTask={open} />
        <main className="flex-1 overflow-auto">
          <Outlet context={{ openNewTask: open }} />
        </main>
      </div>
      {isOpen && <TaskModal onClose={close} />}
    </div>
  )
}
