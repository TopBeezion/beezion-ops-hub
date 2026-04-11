import { Plus } from 'lucide-react'

interface HeaderProps {
  title: string
  onNewTask?: () => void
}

export function Header({ title, onNewTask }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-5 shrink-0 relative"
      style={{
        height: 52,
        backgroundColor: 'rgba(12,14,26,0.97)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* Title */}
      <h1
        className="text-[13px] font-semibold tracking-tight"
        style={{ color: '#f0f2ff' }}
      >
        {title}
      </h1>

      {/* Right: live + action */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: '#22c55e' }} />
          <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#22c55e' }}>
            LIVE
          </span>
        </div>

        {onNewTask && (
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #f5a623 0%, #ff7c1a 100%)',
              color: '#0c0e1a',
              boxShadow: '0 0 18px rgba(245,166,35,0.35), 0 2px 8px rgba(245,166,35,0.2)',
            }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Nueva tarea
          </button>
        )}
      </div>
    </header>
  )
}
