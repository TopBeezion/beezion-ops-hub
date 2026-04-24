import { useState, useRef, useEffect, Fragment } from 'react'
import { useTaskComments, useCreateComment, useRealtimeComments, extractMentions } from '../../hooks/useTaskComments'
import { addNotification } from '../../hooks/useNotifications'
import { notifyMentions } from '../../lib/slackNotify'
import { TEAM_MEMBERS, ASSIGNEE_COLORS } from '../../lib/constants'
import { Send } from 'lucide-react'

const C = {
  bg: '#F7F8FC',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
}

// ── Mention Autocomplete ─────────────────────────────────────────────────────
function MentionAutocomplete({ query, onSelect, position }: {
  query: string
  onSelect: (name: string) => void
  position: { top: number; left: number }
}) {
  const names = TEAM_MEMBERS.filter(n => n !== 'TBD')
  const filtered = query
    ? names.filter(n => n.toLowerCase().startsWith(query.toLowerCase()))
    : names

  if (filtered.length === 0) return null

  return (
    <div style={{
      position: 'absolute', top: position.top, left: position.left, zIndex: 500,
      backgroundColor: '#fff', border: `1px solid ${C.border}`,
      borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
      padding: 4, minWidth: 160, maxHeight: 200, overflowY: 'auto',
    }}>
      {filtered.map(name => {
        const color = ASSIGNEE_COLORS[name] || C.muted
        return (
          <button key={name} onClick={() => onSelect(name)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
            backgroundColor: 'transparent', textAlign: 'left',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F6FA')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              backgroundColor: `${color}25`, color,
              fontSize: 8, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {name.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{name}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Render comment body with highlighted @mentions ───────────────────────────
function CommentBody({ text }: { text: string }) {
  const names = TEAM_MEMBERS.filter(n => n !== 'TBD')
  const pattern = new RegExp(`(@(?:${names.join('|')}))`, 'g')
  const parts = text.split(pattern)

  return (
    <p style={{ fontSize: 13, color: C.text, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <span key={i} style={{
            color: C.accent, fontWeight: 600,
            backgroundColor: `${C.accent}12`, padding: '0 3px', borderRadius: 3,
          }}>
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </p>
  )
}

// ── Time ago helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

// ── Main Panel ───────────────────────────────────────────────────────────────
export function TaskCommentsPanel({ taskId, taskTitle }: {
  taskId: string
  taskTitle: string
}) {
  const { data: comments = [], isLoading } = useTaskComments(taskId)
  useRealtimeComments(taskId)
  const createComment = useCreateComment()

  const [body, setBody] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [acPosition, setAcPosition] = useState({ top: 0, left: 0 })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Get current user
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem('beezion_user')
      if (stored) return JSON.parse(stored)?.name || 'Usuario'
    } catch { /* ignore */ }
    return 'Usuario'
  })()

  // Scroll to bottom on new comments
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [comments.length])

  // Handle textarea input for @mention detection
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setBody(val)

    // Check if we're in a @mention context
    const cursorPos = e.target.selectionStart
    const textBefore = val.slice(0, cursorPos)
    const atMatch = textBefore.match(/@(\w*)$/)

    if (atMatch) {
      setMentionQuery(atMatch[1])
      setShowAutocomplete(true)
      // Position the autocomplete near the textarea
      setAcPosition({ top: -180, left: 10 })
    } else {
      setShowAutocomplete(false)
    }
  }

  const handleMentionSelect = (name: string) => {
    const cursorPos = textareaRef.current?.selectionStart ?? body.length
    const textBefore = body.slice(0, cursorPos)
    const textAfter = body.slice(cursorPos)
    const atIdx = textBefore.lastIndexOf('@')
    const newText = textBefore.slice(0, atIdx) + `@${name} ` + textAfter
    setBody(newText)
    setShowAutocomplete(false)
    textareaRef.current?.focus()
  }

  const handleSubmit = async () => {
    const trimmed = body.trim()
    if (!trimmed || createComment.isPending) return

    try {
      const result = await createComment.mutateAsync({
        taskId, author: currentUser, body: trimmed,
      })

      // In-app notifications for mentions
      const mentions = extractMentions(trimmed)
      if (mentions.length > 0) {
        for (const name of mentions) {
          addNotification({
            id: `mention-${result.id}-${name}`,
            type: 'mention',
            title: `💬 ${currentUser} te mencionó`,
            body: `En la tarea "${taskTitle}": "${trimmed.length > 80 ? trimmed.slice(0, 80) + '...' : trimmed}"`,
            taskId,
            taskTitle,
            timestamp: new Date().toISOString(),
            read: false,
          })
        }

        // Slack DMs
        notifyMentions({
          mentions, author: currentUser,
          taskId, taskTitle,
          commentPreview: trimmed,
        })
      }

      setBody('')
    } catch (err) {
      console.error('Failed to create comment:', err)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Comment list */}
      <div ref={listRef} style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 12 }}>
            Cargando comentarios...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted, fontSize: 12 }}>
            Sin comentarios aún. Escribe el primero.
          </div>
        ) : (
          comments.map(comment => {
            const color = ASSIGNEE_COLORS[comment.author] || C.muted
            return (
              <div key={comment.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: color, color: '#fff',
                  fontSize: 9, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2,
                }}>
                  {comment.author.slice(0, 2).toUpperCase()}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                      {comment.author}
                    </span>
                    <span style={{ fontSize: 10, color: C.muted }}>
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <CommentBody text={comment.body} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Input area */}
      <div style={{
        borderTop: `1px solid ${C.border}`,
        padding: '10px 16px',
        position: 'relative',
        backgroundColor: C.card,
      }}>
        {showAutocomplete && (
          <MentionAutocomplete
            query={mentionQuery}
            onSelect={handleMentionSelect}
            position={acPosition}
          />
        )}

        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
        }}>
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comentario... usa @nombre para mencionar"
            rows={2}
            style={{
              flex: 1, resize: 'none',
              border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '8px 10px', fontSize: 13, fontFamily: 'inherit',
              color: C.text, backgroundColor: C.bg,
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = C.accent)}
            onBlur={e => (e.target.style.borderColor = C.border)}
          />
          <button
            onClick={handleSubmit}
            disabled={!body.trim() || createComment.isPending}
            style={{
              width: 36, height: 36, borderRadius: 8, border: 'none',
              backgroundColor: body.trim() ? C.accent : C.bg,
              color: body.trim() ? '#fff' : C.muted,
              cursor: body.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.15s',
            }}
          >
            <Send size={16} />
          </button>
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
          Enter para enviar · Shift+Enter para nueva línea · @nombre para mencionar
        </div>
      </div>
    </div>
  )
}
