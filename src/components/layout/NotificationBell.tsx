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
              <div className="flex flex-col items-center justify-center" style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: '#F3F4F6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Bell size={22} style={{ color: '#9CA3AF' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#374151', margin: 0 }}>Sin notificaciones</p>
                <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, lineHeight: 1.5 }}>
                  Aquí aparecerán alertas de reuniones<br />y tareas importantes del equipo.
                </p>
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
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{
                        backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                        borderRadius: 10, padding: '10px 14px', marginBottom: 10,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <AlertTriangle size={13} color="#DC2626" />
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: 0 }}>{n.title}</p>
                        </div>
                        <p style={{ fontSize: 11, color: '#991B1B', marginLeft: 21, fontWeight: 500, margin: 0, marginTop: 2, lineHeight: 1.4 }}>{n.body}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {n.tasks.slice(0, 6).map(t => {
                          const areaColor = AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280'
                          return (
                            <button
                              key={t.id}
                              onClick={() => { onOpenTask?.(t.id); setOpen(false) }}
                              style={{
                                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                                gap: 8, padding: '7px 10px', borderRadius: 8, border: `1px solid ${N.border}`,
                                backgroundColor: 'transparent', cursor: 'pointer', transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = N.hover)}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                backgroundColor: `${areaColor}15`, color: areaColor, flexShrink: 0,
                                textTransform: 'uppercase', letterSpacing: '0.03em',
                              }}>
                                {t.area}
                              </span>
                              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.title}
                              </span>
                              {(t.days_overdue ?? 0) > 0 && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, color: '#EF4444',
                                  backgroundColor: '#FEF2F2', padding: '2px 6px',
                                  borderRadius: 4, border: '1px solid #FECACA', flexShrink: 0,
                                }}>
                                  {t.days_overdue}d
                                </span>
                              )}
                            </button>
                          )
                        })}
                        {n.tasks.length > 6 && (
                          <p style={{ fontSize: 11, textAlign: 'center', padding: '4px 0', color: '#9CA3AF', fontWeight: 500 }}>
                            +{n.tasks.length - 6} tareas más atrasadas
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Meeting / generic notification */
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: N.text, margin: 0, lineHeight: 1.3 }}>{n.title}</p>
                          <p style={{ fontSize: 11, color: '#4B5563', fontWeight: 500, margin: '4px 0 0', lineHeight: 1.4 }}>{n.body}</p>
                        </div>
                        <span style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 500, flexShrink: 0, marginTop: 2 }}>
                          {new Date(n.timestamp).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {n.tasks.slice(0, 5).map(t => {
                          const areaColor = AREA_COLORS[t.area as keyof typeof AREA_COLORS] ?? '#6b7280'
                          const assigneeColor = ASSIGNEE_COLORS[t.assignee] ?? '#6b7280'
                          return (
                            <button
                              key={t.id}
                              onClick={() => { onOpenTask?.(t.id); setOpen(false) }}
                              style={{
                                width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center',
                                gap: 8, padding: '7px 10px', borderRadius: 8, border: `1px solid ${N.border}`,
                                backgroundColor: 'transparent', cursor: 'pointer', transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.backgroundColor = N.hover)}
                              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <span style={{
                                fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                                backgroundColor: `${areaColor}15`, color: areaColor, flexShrink: 0,
                                textTransform: 'uppercase', letterSpacing: '0.03em',
                              }}>
                                {t.area}
                              </span>
                              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {t.title}
                              </span>
                              <div style={{
                                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                                background: `linear-gradient(135deg, ${assigneeColor}30, ${assigneeColor}15)`,
                                color: assigneeColor, fontSize: 8, fontWeight: 800,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: `1px solid ${assigneeColor}30`,
                              }}>
                                {t.assignee.slice(0, 2).toUpperCase()}
                              </div>
                            </button>
                          )
                        })}
                        {n.tasks.length > 5 && (
                          <p style={{ fontSize: 11, textAlign: 'center', padding: '4px 0', color: '#9CA3AF', fontWeight: 500 }}>
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
