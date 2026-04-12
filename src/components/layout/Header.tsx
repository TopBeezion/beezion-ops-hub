import { Plus, Search, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { NotificationBell } from './NotificationBell'
import { useTasks } from '../../hooks/useTasks'
import { useClients } from '../../hooks/useClients'
import type { Task, Client } from '../../types'
import { ASSIGNEE_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../lib/constants'

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

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

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
    if (e.key === 'Enter' && results[selectedIdx]) {
      onOpenTask?.(results[selectedIdx])
      onClose()
    }
  }

  function getClientForTask(task: Task): Client | undefined {
    return clients.find(c => c.id === task.client_id)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(15,17,26,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 580, maxWidth: '90vw',
          backgroundColor: '#fff',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px',
          borderBottom: '1px solid #E4E7F0',
        }}>
          <Search size={16} color="#9699B0" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tareas, responsables, clientes..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#1A1D27',
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9699B0', padding: 2 }}>
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: 10, fontWeight: 600, color: '#9699B0',
            backgroundColor: '#F0F2F8', border: '1px solid #E4E7F0',
            borderRadius: 5, padding: '2px 6px',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        {q.length >= 2 && (
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: '#9699B0', fontSize: 13 }}>
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
                    padding: '10px 16px',
                    backgroundColor: isSelected ? '#F5F3FF' : 'transparent',
                    borderBottom: '1px solid #F0F2F8',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onClick={() => { onOpenTask?.(task); onClose() }}
                >
                  {/* Status dot */}
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: statusColor,
                  }} />

                  {/* Title */}
                  <p style={{ fontSize: 13, color: '#1A1D27', flex: 1, fontWeight: 500 }} className="truncate">
                    {task.title}
                  </p>

                  {/* Client badge */}
                  {client && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, flexShrink: 0,
                      color: client.color, backgroundColor: `${client.color}18`,
                      padding: '2px 6px', borderRadius: 4,
                      border: `1px solid ${client.color}30`,
                    }}>
                      {client.name}
                    </span>
                  )}

                  {/* Status label */}
                  <span style={{
                    fontSize: 10, fontWeight: 600, flexShrink: 0,
                    color: statusColor, backgroundColor: `${statusColor}15`,
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    {STATUS_LABELS[task.status]}
                  </span>

                  {/* Assignee avatar */}
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: `${assigneeColor}20`,
                    color: assigneeColor, fontSize: 8, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${assigneeColor}30`,
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
          padding: '8px 16px',
          borderTop: '1px solid #F0F2F8',
          display: 'flex', gap: 16, alignItems: 'center',
        }}>
          {[
            ['↑↓', 'navegar'],
            ['↵', 'abrir tarea'],
            ['ESC', 'cerrar'],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <kbd style={{
                fontSize: 9, fontWeight: 700, color: '#6366F1',
                backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE',
                borderRadius: 4, padding: '1px 5px',
              }}>{key}</kbd>
              <span style={{ fontSize: 10, color: '#9699B0' }}>{label}</span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#C0C3D0' }}>
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
}

export function Header({ title, onNewTask, onOpenTaskById, onOpenTaskDetail }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false)

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleOpenTask = useCallback((task: Task) => {
    onOpenTaskDetail?.(task)
  }, [onOpenTaskDetail])

  return (
    <>
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
          gap: 16,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: '16px',
            fontWeight: '700',
            color: '#1F2128',
            margin: 0,
            flexShrink: 0,
          }}
        >
          {title}
        </h1>

        {/* Search bar (center) */}
        <button
          onClick={() => setSearchOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            flex: 1, maxWidth: 340,
            padding: '7px 12px',
            borderRadius: 8, cursor: 'pointer',
            backgroundColor: '#F6F7FB',
            border: '1px solid #E4E7F0',
            color: '#9699B0',
            fontSize: 12,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#F0F2F8'
            e.currentTarget.style.borderColor = '#C7D2FE'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#F6F7FB'
            e.currentTarget.style.borderColor = '#E4E7F0'
          }}
        >
          <Search size={13} />
          <span style={{ flex: 1, textAlign: 'left' }}>Buscar tareas...</span>
          <kbd style={{
            fontSize: 9, fontWeight: 700, color: '#9699B0',
            backgroundColor: '#ECEDF3', border: '1px solid #DDE0EC',
            borderRadius: 4, padding: '1px 5px', flexShrink: 0,
          }}>
            ⌘K
          </kbd>
        </button>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
          {/* Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: '#10B981',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }} />
            <span style={{
              fontSize: '10px', color: '#10B981',
              fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              LIVE
            </span>
          </div>

          {/* Notification Bell */}
          <NotificationBell onOpenTask={onOpenTaskById} />

          {/* New Task Button */}
          <button
            onClick={onNewTask}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              paddingLeft: '12px', paddingRight: '12px',
              paddingTop: '8px', paddingBottom: '8px',
              fontSize: '13px', fontWeight: '600',
              color: 'white', border: 'none',
              borderRadius: '8px', backgroundColor: '#6366F1',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease, transform 0.15s ease',
              boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#4F46E5'
              e.currentTarget.style.transform = 'scale(1.03)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#6366F1'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            Nueva tarea
          </button>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}</style>
      </header>

      {/* Global search modal */}
      {searchOpen && (
        <SearchModal
          onClose={() => setSearchOpen(false)}
          onOpenTask={handleOpenTask}
        />
      )}
    </>
  )
}
