import { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle } from 'lucide-react'
import { useNotifications, useMeetingTaskWatcher, useOverdueNotifier } from '../../hooks/useNotifications'
import { AREA_COLORS } from '../../lib/constants'

const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8b5cf6', Alec: '#f5a623', Jose: '#3b82f6',
  Luisa: '#ef4444', Paula: '#ec4899', David: '#06b6d4', Johan: '#10b981', Felipe: '#f97316',
}

// Design tokens — white theme
const N = {
  bg: '#FFFFFF',
  border: '#E4E7F0',
  headerBorder: '#F0F2F8',
  text: '#1A1D27',
  sub: '#6B7280',
  faint: '#9CA3AF',
  hover: '#F5F6FA',
  accent: '#6366F1',
}

export function NotificationBell({ onOpenTask }: { onOpenTask?: (taskId: string) => void }) {
  useMeetingTaskWatcher()
  // Temporalmente desactivado - activar cuando todas las tareas tengan fecha límite establecida
  // useOverdueNotifier()

  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleOpen = () => {
    setOpen(o => {
      if (!o) markAllRead()
      return !o
    })
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg transition-colors"
        style={{ backgroundColor: open ? N.hover : 'transparent' }}
        title="Notificaciones"
      >
        <Bell size={15} style={{ color: unreadCount > 0 ? '#EF4444' : '#9CA3AF' }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: '#FFFFFF',
              boxShadow: '0 0 6px rgba(239,68,68,0.4)',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50"
          style={{
            width: 380,
            backgroundColor: N.bg,
            border: `1px solid ${N.border}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3.5"
            style={{ borderBottom: `1px solid ${N.headerBorder}` }}
          >
            <span className="text-sm font-bold" style={{ color: N.text }}>Notificaciones</span>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-medium"
                style={{ color: N.accent }}
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-auto" style={{ maxHeight: 460 }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell size={20} style={{ color: '#D1D5DB' }} />
                <p className="text-xs mt-3 font-medium" style={{ color: '#9CA3AF' }}>Sin notificaciones</p>
              </div>
            ) : (
              notifications.map((n, idx) => (
                <div
                  key={n.id}
                  style={{
                    borderBottom: idx < notifications.length - 1 ? `1px solid ${N.headerBorder}` : 'none',
                  }}
                >
                  {/* Overdue notification */}
                  {n.type === 'overdue_tasks' ? (
                    <div style={{ padding: '12px 16px' }}>
                      <div
                        style={{
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: 8,
                          padding: '8px 12px',
                          marginBottom: 8,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <AlertTriangle size={12} color="#DC2626" />
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>{n.title}</p>
                        </div>
                        <p style={{ fontSize: 10, color: '#991B1B', marginLeft: 20, fontWeight: 500 }}>{n.body}</p>
                      </div>
                      <div className="space-y-1">
                        {n.tasks.slice(0, 6).map(t => (
                          <button
                            key={t.id}
                            onClick={() => { onOpenTask?.(t.id); setOpen(false) }}
                            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = N.hover)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                backgroundColor: `${AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280'}18`,
                                color: AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280',
                              }}
                            >
                              {t.area}
                            </span>
                            <span className="flex-1 text-xs truncate font-semibold" style={{ color: '#1F2937' }}>
                              {t.title}
                            </span>
                            {(t.days_overdue ?? 0) > 0 && (
                              <span
                                style={{
                                  fontSize: 9, fontWeight: 700, color: '#EF4444',
                                  backgroundColor: '#FEF2F2', padding: '1px 5px',
                                  borderRadius: 4, border: '1px solid #FECACA', flexShrink: 0,
                                }}
                              >
                                {t.days_overdue}d
                              </span>
                            )}
                          </button>
                        ))}
                        {n.tasks.length > 6 && (
                          <p className="text-xs text-center py-1 font-medium" style={{ color: '#9CA3AF' }}>
                            +{n.tasks.length - 6} tareas más atrasadas
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Meeting / generic notification */
                    <div className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-bold" style={{ color: N.text }}>{n.title}</p>
                          <p className="text-xs mt-1" style={{ color: '#4B5563', fontWeight: 500 }}>{n.body}</p>
                        </div>
                        <span className="text-xs shrink-0" style={{ color: '#9CA3AF', fontWeight: 500 }}>
                          {new Date(n.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {n.tasks.slice(0, 5).map(t => (
                          <button
                            key={t.id}
                            onClick={() => { onOpenTask?.(t.id); setOpen(false) }}
                            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors"
                            style={{ border: `1px solid ${N.border}`, backgroundColor: 'transparent' }}
                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = N.hover)}
                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                              style={{
                                backgroundColor: `${AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280'}18`,
                                color: AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280',
                              }}
                            >
                              {t.area}
                            </span>
                            <span className="flex-1 text-xs truncate font-semibold" style={{ color: '#1F2937' }}>
                              {t.title}
                            </span>
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
                              style={{
                                background: `linear-gradient(135deg, ${ASSIGNEE_COLORS[t.assignee] ?? '#6b7280'}30, ${ASSIGNEE_COLORS[t.assignee] ?? '#6b7280'}15)`,
                                color: ASSIGNEE_COLORS[t.assignee] ?? '#6b7280',
                                border: `1px solid ${ASSIGNEE_COLORS[t.assignee] ?? '#6b7280'}30`,
                              }}
                            >
                              {t.assignee.slice(0, 2).toUpperCase()}
                            </div>
                          </button>
                        ))}
                        {n.tasks.length > 5 && (
                          <p className="text-xs text-center py-1 font-medium" style={{ color: '#9CA3AF' }}>
                            +{n.tasks.length - 5} tareas más en el backlog
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
