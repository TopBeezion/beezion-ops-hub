import { Plus, Search, X } from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { NotificationBell } from './NotificationBell'
import { useTasks } from '../../hooks/useTasks'
import { useClients } from '../../hooks/useClients'
import type { Task, Client } from '../../types'
import { ASSIGNEE_COLORS, STATUS_COLORS, STATUS_LABELS } from '../../lib/constants'

// ─── Tokens ───────────────────────────────────────────────────────────────────
const H = {
  bg:      '#111318',
  border:  'rgba(255,255,255,0.07)',
  text:    '#E8EAED',
  sub:     '#8B8FA8',
  muted:   '#525669',
  surface: '#1C1F26',
  hover:   '#22262F',
  accent:  '#7C83F7',
  input:   'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,255,255,0.09)',
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
        backgroundColor: 'rgba(8,10,16,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 600, maxWidth: '92vw',
          backgroundColor: '#1C1F26',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <Search size={16} color="#525669" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar tareas, responsables, clientes..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, color: '#E8EAED', fontWeight: 500,
              backgroundColor: 'transparent',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#525669', padding: 2 }}>
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: 9, fontWeight: 700, color: '#525669',
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 5, padding: '2px 7px',
          }}>ESC</kbd>
        </div>

        {/* Results */}
        {q.length >= 2 && (
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {results.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: '#525669', fontSize: 13 }}>
                Sin resultados para "{query}"
              </div>
            ) : results.map((task, idx) => {
              const client = getClientForTask(task)
              const isSelected = idx === selectedIdx
              const assigneeColor = ASSIGNEE_COLORS[task.assignee] || '#525669'
              const statusColor = STATUS_COLORS[task.status]
              return (
                <div
                  key={task.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 18px',
                    backgroundColor: isSelected ? 'rgba(124,131,247,0.1)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setSelectedIdx(idx)}
                  onClick={() => { onOpenTask?.(task); onClose() }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: statusColor }} />
                  <p style={{ fontSize: 13, color: '#D0D3DF', flex: 1, fontWeight: 500 }} className="truncate">
                    {task.title}
                  </p>
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
                  <span style={{
                    fontSize: 10, fontWeight: 600, flexShrink: 0,
                    color: statusColor, backgroundColor: `${statusColor}15`,
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: `${assigneeColor}20`, color: assigneeColor,
                    fontSize: 8, fontWeight: 800,
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
          padding: '8px 18px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', gap: 18, alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.02)',
        }}>
          {[['↑↓', 'navegar'], ['↵', 'abrir'], ['ESC', 'cerrar']].map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <kbd style={{
                fontSize: 9, fontWeight: 700, color: '#7C83F7',
                backgroundColor: 'rgba(124,131,247,0.12)',
                border: '1px solid rgba(124,131,247,0.25)',
                borderRadius: 4, padding: '1px 5px',
              }}>{key}</kbd>
              <span style={{ fontSize: 10, color: '#525669' }}>{label}</span>
            </div>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 10, color: '#3A3D50' }}>
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
        paddingLeft: 22, paddingRight: 22, gap: 16,
        flexShrink: 0,
      }}>
        {/* Page title */}
        <h1 style={{ fontSize: 15, fontWeight: 700, color: H.text, margin: 0, flexShrink: 0, letterSpacing: '-0.2px' }}>
          {title}
        </h1>

        {/* Search pill */}
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
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'
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
            backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '1px 5px', flexShrink: 0,
          }}>⌘K</kbd>
        </button>

        {/* Right section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {/* Live pulse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px rgba(16,185,129,0.6)',
              animation: 'hdr-pulse 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 9, color: '#10B981', fontWeight: 700, letterSpacing: '0.12em' }}>LIVE</span>
          </div>

          {/* Notification Bell */}
          <NotificationBell onOpenTask={onOpenTaskById} />

          {/* New Task */}
          <button
            onClick={onNewTask}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', fontSize: 12, fontWeight: 700,
              color: '#fff', border: 'none', borderRadius: 8,
              background: 'linear-gradient(135deg, #7C83F7, #5B63F0)',
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(124,131,247,0.35)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(124,131,247,0.5)'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(124,131,247,0.35)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Nueva tarea
          </button>
        </div>

        <style>{`
          @keyframes hdr-pulse {
            0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(16,185,129,0.6); }
            50%       { opacity: 0.6; box-shadow: 0 0 4px rgba(16,185,129,0.3); }
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
