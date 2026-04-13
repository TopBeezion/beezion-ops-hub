import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications, useMeetingTaskWatcher } from '../../hooks/useNotifications'
import { AREA_COLORS } from '../../lib/constants'

const ASSIGNEE_COLORS: Record<string, string> = {
  Alejandro: '#8b5cf6', Alec: '#f5a623', Paula: '#ec4899',
  'Jose Luis': '#3b82f6', 'Editor 1': '#06b6d4', 'Editor 2': '#10b981', 'Editor 3': '#f97316',
}

export function NotificationBell({ onOpenTask }: { onOpenTask?: (taskId: string) => void }) {
  useMeetingTaskWatcher()

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
        className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
        title="Notificaciones"
      >
        <Bell size={15} style={{ color: unreadCount > 0 ? '#f5a623' : '#6b6b6b' }} />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #f5a623, #ff7c1a)',
              color: '#0f0f0f',
              boxShadow: '0 0 8px rgba(245,166,35,0.5)',
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
            width: 360,
            backgroundColor: '#111111',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-xs font-bold" style={{ color: '#f5f5f5' }}>Notificaciones</span>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-medium"
                style={{ color: '#f5a623' }}
              >
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-auto" style={{ maxHeight: 420 }}>
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Bell size={20} style={{ color: '#303030' }} />
                <p className="text-xs mt-2" style={{ color: '#585858' }}>Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className="px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {/* Notification header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-[12px] font-semibold" style={{ color: '#f5f5f5' }}>{n.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#a1a1a1' }}>{n.body}</p>
                    </div>
                    <span className="text-[9px] shrink-0" style={{ color: '#585858' }}>
                      {new Date(n.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Task list */}
                  <div className="space-y-1">
                    {n.tasks.slice(0, 5).map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onOpenTask?.(t.id); setOpen(false) }}
                        className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                        style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                      >
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{
                            backgroundColor: `${AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280'}15`,
                            color: AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280',
                          }}
                        >
                          {t.area}
                        </span>
                        <span className="flex-1 text-[11px] truncate font-medium" style={{ color: '#d0d3ea' }}>
                          {t.title}
                        </span>
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${ASSIGNEE_COLORS[t.assignee] ?? '#6b7280'}40, ${ASSIGNEE_COLORS[t.assignee] ?? '#6b7280'}20)`,
                            color: ASSIGNEE_COLORS[t.assignee] ?? '#6b7280',
                          }}
                        >
                          {t.assignee.slice(0, 2).toUpperCase()}
                        </div>
                      </button>
                    ))}
                    {n.tasks.length > 5 && (
                      <p className="text-[10px] text-center py-1" style={{ color: '#585858' }}>
                        +{n.tasks.length - 5} tareas más en el backlog
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
