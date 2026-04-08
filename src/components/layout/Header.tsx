import { Plus } from 'lucide-react'
import { NotificationBell } from './NotificationBell'

interface HeaderProps {
  title: string
  onNewTask?: () => void
  onOpenTaskById?: (id: string) => void
}

export function Header({ title, onNewTask, onOpenTaskById }: HeaderProps) {
  return (
    <header
      style={{
        height: '52px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'rgba(15, 17, 23, 0.97)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: '24px',
        paddingRight: '24px',
      }}
    >
      {/* Title */}
      <h1
        style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#E5E7EB',
          margin: 0,
          letterSpacing: '0.5px',
        }}
      >
        {title}
      </h1>

      {/* Right section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Live indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            className="pulse-dot"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
            }}
          />
          <span
            style={{
              fontSize: '10px',
              color: '#10B981',
              fontWeight: '600',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            LIVE
          </span>
        </div>

        {/* Notification Bell */}
        <NotificationBell onOpenTask={onOpenTaskById} />

        {/* New Task Button */}
        {onNewTask && (
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Nueva tarea
          </button>
        )}
      </div>
    </header>
  )
}
