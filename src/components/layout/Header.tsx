import { Plus, Search, X, Menu } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { NotificationBell } from './NotificationBell'
import { useTasks } from '../../hooks/useTasks'
import { useClients } from '../../hooks/useClients'
import type { Task, Client } from '../../types'
import { ASSIGNEE_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../lib/constants'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const H = {
  bg:          '#FFFFFF',
  border:      '#E4E7F0',
  text:        '#1A1D27',
  sub:         '#5A5E72',
  muted:       '#9699B0',
  surface:     '#F5F6FA',
  hover:       '#ECEDF3',
  accent:      '#6366F1',
  input:       '#F0F2F8',
  inputBorder: '#E4E7F0',
}

// ─── Search Modal ─────────────────────────────────────────────────────────────
function SearchModal({ onClose, onOpenTask }: {
  onClose: () => void
  onOpenTask?: (t: Task) => void
}) {
  const [query, setQuery] = useState('')
  const { data: tasks = [] } = useTasks()
  const { data: clients = [] } = useClients()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.trim().toLowerCase()
  const results = q.length < 2 ? [] : tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.assignee.toLowerCase().includes(q) ||
    ((t.client as Client | undefined)?.name ?? '').toLowerCase().includes(q)
  ).slice(0, 10)

  useEffect(() => { setSelectedIdx(0) }, [results.length])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && results[selectedIdx]) { onOpenTask?.(results[selectedIdx]); onClose() }
  }

  function getClientForTask(task: Task): Client | undefined {
    return clients.find(c => c.id === task.client_id)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 600, maxWidth: '92vw',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E4E7F0',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid #F0F2F8',
        }}>
          <Search size={16} color="#9699B0" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tareas, responsables, clientes..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#1A1D27', fontWeight: 500,
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9699B0', padding: 2 }}>
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: 9, fontWeight: 700, color: '#9699B0',
            backgroundColor: '#F0F2F8',
            border: '1px solid #E4E7F0',
            borderRadius: 5, padding: '2px 7px',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        {q.length >= 2 && (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#9699B0', fontSize: 13 }}>
                Sin resultados para "{query}"
              </div>
            ) : results.map((task, idx) => {
              const client = getClientForTask(task)
              const isSelected = idx === selectedIdx
              const assigneeColor = ASSIGNEE_COLORS[task.assignee] || '#9699B0'
              const statusColor = STATUS_COLORS[task.status]
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 18px',
                    backgroundColor: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent',
                    borderBottom: '1px solid #F5F6FA',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onClick={() => { onOpenTask?.(task); onClose() }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: statusColor }} />
                  <p style={{ fontSize: 13, color: '#374151', flex: 1, fontWeight: 500, margin: 0 }} className="truncate">
                    {task.title}
                  </p>
                  {client && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      color: client.color, backgroundColor: `${client.color}12`,
                      padding: '2px 6px', borderRadius: 4,
                      border: `1px solid ${client.color}25`,
                    }}>
                      {client.name}
                    </span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 600, flexShrink: 0,
                    color: statusColor, backgroundColor: `${statusColor}12`,
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: `${assigneeColor}18`, color: assigneeColor,
                    fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${assigneeColor}25`,
                  }} title={task.assignee}>
                    {task.assignee.slice(0, 2).toUpperCase()}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Hint footer */}
        <div style={{
          padding: '8px 18px',
          borderTop: '1px solid #F0F2F8',
          display: 'flex', gap: 18, alignItems: 'center',
          backgroundColor: '#FAFBFC',
        }}>
          {[['↑↓', 'navegar'], ['↵', 'abrir'], ['ESC', 'cerrar']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <kbd style={{
                fontSize: 9, fontWeight: 700, color: '#6366F1',
                backgroundColor: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 4, padding: '1px 5px',
              }}>{key}</kbd>
              <span style={{ fontSize: 10, color: '#9699B0' }}>{label}</span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#C4C9D4' }}>
            {results.length > 0 ? `${results.length} resultados` : ''}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
interface HeaderProps {
  title: string
  onNewTask?: () => void
  onOpenTaskById?: (id: string) => void
  onOpenTaskDetail?: (t: Task) => void
  isMobile?: boolean
  onMenuToggle?: () => void
}

export function Header({ title, onNewTask, onOpenTaskById, onOpenTaskDetail, isMobile, onMenuToggle }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleOpenTask = useCallback((task: Task) => {
    onOpenTaskDetail?.(task)
  }, [onOpenTaskDetail])

  return (
    <>
      <header style={{
        height: 52,
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: H.bg,
        borderBottom: `1px solid ${H.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingLeft: isMobile ? 12 : 22, paddingRight: isMobile ? 12 : 22, gap: isMobile ? 8 : 16,
        flexShrink: 0,
      }}>
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={onMenuToggle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              border: 'none', background: 'none', cursor: 'pointer',
              color: H.text, flexShrink: 0,
            }}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Page title */}
        <h1 style={{
          fontSize: isMobile ? 14 : 15, fontWeight: 700, color: H.text, margin: 0,
          flexShrink: isMobile ? 1 : 0, letterSpacing: '-0.2px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {title}
        </h1>

        {/* Search pill — icon only on mobile */}
        {isMobile ? (
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              backgroundColor: H.input, border: `1px solid ${H.inputBorder}`,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <Search size={15} color={H.muted} />
          </button>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              flex: 1, maxWidth: 340,
              padding: '7px 12px', borderRadius: 9,
              cursor: 'pointer',
              backgroundColor: H.input,
              border: `1px solid ${H.inputBorder}`,
              color: H.muted, fontSize: 12,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = H.hover
              e.currentTarget.style.borderColor = '#C4C9D4'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = H.input
              e.currentTarget.style.borderColor = H.inputBorder
            }}
          >
            <Search size={13} color={H.muted} />
            <span style={{ flex: 1, textAlign: 'left' }}>Buscar tareas...</span>
            <kbd style={{
              fontSize: 9, fontWeight: 700, color: H.muted,
              backgroundColor: '#FFFFFF',
              border: `1px solid ${H.border}`,
              borderRadius: 4, padding: '1px 5px', flexShrink: 0,
            }}>⌘K</kbd>
          </button>
        )}

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexShrink: 0 }}>
          {/* Live pulse — hide on mobile */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 6px rgba(16,185,129,0.5)',
                animation: 'hdr-pulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 9, color: '#10B981', fontWeight: 700, letterSpacing: '0.12em' }}>LIVE</span>
            </div>
          )}

          {/* Notification Bell */}
          <NotificationBell onOpenTask={onOpenTaskById} />

          {/* New Task — icon only on mobile */}
          <button
            onClick={onNewTask}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: isMobile ? '7px' : '7px 14px',
              fontSize: 12, fontWeight: 700,
              color: '#fff', border: 'none', borderRadius: 8,
              background: 'linear-gradient(135deg, #6366F1, #5B63F0)',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(99,102,241,0.30)',
              transition: 'all 0.15s',
              width: isMobile ? 36 : 'auto',
              height: isMobile ? 36 : 'auto',
            }}
          >
            <Plus size={isMobile ? 18 : 14} strokeWidth={2.5} />
            {!isMobile && 'Nueva tarea'}
          </button>
        </div>

        <style>{`
          @keyframes hdr-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(16,185,129,0.5); }
            50%       { opacity: 0.6; box-shadow: 0 0 3px rgba(16,185,129,0.2); }
          }
        `}</style>
      </header>

      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onOpenTask={handleOpenTask}
        />
      )}
    </>
  )
}
