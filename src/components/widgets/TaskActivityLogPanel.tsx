import { useTaskActivityLog } from '../../hooks/useActivityLog'

interface Props { taskId: string }

function fmtDate(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  } catch { return iso }
}

export function TaskActivityLogPanel({ taskId }: Props) {
  const { data, isLoading } = useTaskActivityLog(taskId)
  if (isLoading) return <div style={{ fontSize: 11, color: '#9CA3AF' }}>Cargando historial…</div>
  const rows = data ?? []
  if (!rows.length) return <div style={{ fontSize: 11, color: '#9CA3AF' }}>Sin historial todavía.</div>

  const actionColor = (a: string) => a === 'insert' ? '#10B981' : a === 'delete' ? '#EF4444' : '#6366F1'
  const actionLabel = (a: string) => a === 'insert' ? 'creada' : a === 'delete' ? 'eliminada' : 'actualizada'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map(r => {
        const diffKeys = r.diff ? Object.keys(r.diff) : []
        return (
          <div key={r.id} style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: '#F8F9FC', border: '1px solid #E8EAF2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: actionColor(r.action) }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{r.actor ?? 'sistema'}</span>
              <span style={{ fontSize: 10, color: '#9CA3AF' }}>{actionLabel(r.action)}</span>
              <span style={{ fontSize: 9, color: '#BFC3CF', marginLeft: 'auto' }}>{fmtDate(r.created_at)}</span>
            </div>
            {r.action === 'update' && diffKeys.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {diffKeys.slice(0, 6).map(k => {
                  const d = r.diff[k]
                  return (
                    <div key={k} style={{ fontSize: 10, color: '#6B7280', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700 }}>{k}:</span>{' '}
                      <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>{String(d.old ?? '—')}</span>
                      {' → '}
                      <span style={{ color: '#1F2128' }}>{String(d.new ?? '—')}</span>
                    </div>
                  )
                })}
                {diffKeys.length > 6 && <div style={{ fontSize: 10, color: '#9CA3AF' }}>+ {diffKeys.length - 6} cambios más</div>}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
