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
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E6E9EF',
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
          fontSize: '16px',
          fontWeight: '700',
          color: '#1F2128',
          margin: 0,
          letterSpacing: '0px',
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
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        <button
          onClick={onNewTask}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingLeft: '12px',
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: '13px',
            fontWeight: '500',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: '#6366F1',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => {
            const button = e.currentTarget
            button.style.backgroundColor = '#4F46E5'
            button.style.transform = 'scale(1.05)'
          }}
          onMouseLeave={(e) => {
            const button = e.currentTarget
            button.style.backgroundColor = '#6366F1'
            button.style.transform = 'scale(1)'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          Nueva tarea
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </header>
  )
}
