import { useTeamCapacity } from '../../hooks/useProgress'
import { useAuth } from '../../hooks/useAuth'
import { isAdminPlus, ASSIGNEE_COLORS, PRIORITY_COLORS } from '../../lib/constants'

export function TeamCapacityPanel() {
  const { user } = useAuth()
  const isAllowed = isAdminPlus(user)
  const { data, isLoading } = useTeamCapacity(isAllowed)

  if (!isAllowed) return null
  if (isLoading) return <div style={{ padding: 16, color: '#9CA3AF' }}>Cargando capacidad del equipo…</div>
  const rows = (data ?? []).sort((a, b) => b.open_tasks - a.open_tasks)

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #E8EAF2', borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1F2128', margin: 0 }}>⚖️ Capacidad del equipo</h3>
        <span style={{ fontSize: 10, color: '#9CA3AF' }}>solo admin+</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map(r => {
          const col = ASSIGNEE_COLORS[r.assignee] ?? '#9CA3AF'
          const total = r.open_tasks || 1
          return (
            <div key={r.assignee} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 70, fontSize: 11, fontWeight: 700, color: col }}>{r.assignee}</span>
              <div style={{ flex: 1, display: 'flex', height: 14, borderRadius: 6, overflow: 'hidden', border: '1px solid #E8EAF2' }}>
                <div style={{ width: `${(r.alerta_roja / total) * 100}%`, backgroundColor: PRIORITY_COLORS.alerta_roja }} />
                <div style={{ width: `${(r.alta / total) * 100}%`, backgroundColor: PRIORITY_COLORS.alta }} />
                <div style={{ width: `${(r.media / total) * 100}%`, backgroundColor: PRIORITY_COLORS.media }} />
                <div style={{ width: `${(r.baja / total) * 100}%`, backgroundColor: PRIORITY_COLORS.baja }} />
              </div>
              <span style={{ width: 36, textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#374151' }}>{r.open_tasks}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
