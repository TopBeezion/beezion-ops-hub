import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useTaskModal } from '../../hooks/useTaskModal'
import { useRealtimeTasks } from '../../hooks/useTasks'
import { useTasks } from '../../hooks/useTasks'
import { TaskModal } from '../tasks/TaskModal'
import { TaskDetailDrawer } from '../tasks/TaskDetailDrawer'
import { useIsMobile } from '../../hooks/useIsMobile'
import type { Task } from '../../types'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/bomberos': '🔥 Bomberos',
  '/campaigns': 'Campañas',
  '/backlog': 'Backlog',
  '/kanban': 'Kanban',
  '/timeline': 'Timeline',
  '/settings': 'Configuración',
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()
  const location = useLocation()
  const { isOpen, open, close } = useTaskModal()
  const { data: allTasks = [] } = useTasks()
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  useRealtimeTasks()

  const title =
    ROUTE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/clients/') ? 'Cliente' : 'Beezion Ops')

  const openTaskDetail = useCallback((task: Task) => setSelectedTask(task), [])
  const openTaskById   = useCallback((id: string) => {
    const t = allTasks.find(t => t.id === id)
    if (t) setSelectedTask(t)
  }, [allTasks])
  const closeTaskDetail = useCallback(() => setSelectedTask(null), [])

  // Close mobile menu on navigation
  const handleNavClick = useCallback(() => {
    if (isMobile) setMobileMenuOpen(false)
  }, [isMobile])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F0F2F8' }}>
      {/* Desktop sidebar */}
      {!isMobile && (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onNavClick={handleNavClick} />
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)',
            }}
          />
          <div style={{
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 280, zIndex: 50,
            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          }}>
            <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} onNavClick={handleNavClick} />
          </div>
        </>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          title={title}
          onNewTask={open}
          onOpenTaskById={openTaskById}
          onOpenTaskDetail={openTaskDetail}
          isMobile={isMobile}
          onMenuToggle={() => setMobileMenuOpen(o => !o)}
        />
        <main className="flex-1 overflow-auto">
          <Outlet context={{ openNewTask: open, openTaskDetail }} />
        </main>
      </div>
      {isOpen && <TaskModal onClose={close} />}
      {selectedTask && (
        <TaskDetailDrawer task={selectedTask} onClose={closeTaskDetail} />
      )}
    </div>
  )
}
