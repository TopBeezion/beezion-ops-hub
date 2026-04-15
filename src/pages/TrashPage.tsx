import { Trash2, Undo2, AlertTriangle } from 'lucide-react'
import {
  useTrashedCampaigns,
  useRestoreCampaign,
  useHardDeleteCampaign,
} from '../hooks/useCampaigns'
import { CAMPAIGN_TYPE_COLORS } from '../lib/constants'

const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
  accent: '#6366F1',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
}

const PURGE_DAYS = 7

function daysUntilPurge(deletedAt: string): number {
  const deleted = new Date(deletedAt).getTime()
  const expires = deleted + PURGE_DAYS * 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000)))
}

export function TrashPage() {
  const { data: trashed = [], isLoading } = useTrashedCampaigns()
  const restore = useRestoreCampaign()
  const hardDelete = useHardDeleteCampaign()

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100%', padding: '20px 24px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Trash2 size={18} /> Papelera
          </h1>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            Las campañas borradas se conservan acá durante {PURGE_DAYS} días. Después se eliminan automáticamente.
          </p>
        </div>

        <div style={{
          background: '#FFF7ED', border: `1px solid #FED7AA`, color: '#9A3412',
          borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12,
        }}>
          <AlertTriangle size={14} />
          <span>Eliminar permanentemente borra también las tareas de la campaña. No se puede deshacer.</span>
        </div>

        <div style={{
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          overflow: 'hidden',
        }}>
          {isLoading ? (
            <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 12 }}>Cargando…</div>
          ) : trashed.length === 0 ? (
            <div style={{ padding: 50, textAlign: 'center', color: C.muted }}>
              <Trash2 size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>La papelera está vacía 🎉</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FAFBFE', borderBottom: `1px solid ${C.border}` }}>
                  <th style={th}>Campaña</th>
                  <th style={th}>Cliente</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Eliminada</th>
                  <th style={th}>Expira en</th>
                  <th style={{ ...th, textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {trashed.map(c => {
                  const days = daysUntilPurge(c.deleted_at)
                  const urgent = days <= 2
                  return (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 4, height: 16, borderRadius: 2,
                            background: CAMPAIGN_TYPE_COLORS[c.type] ?? C.accent,
                          }} />
                          <span style={{ fontWeight: 600, color: C.text }}>{c.name}</span>
                          {c.parent_campaign_id && (
                            <span style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>(sub-campaña)</span>
                          )}
                        </div>
                      </td>
                      <td style={td}>
                        <span style={{ color: C.sub }}>{c.client?.name ?? '—'}</span>
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: 11, color: C.sub, textTransform: 'capitalize' }}>{c.type}</span>
                      </td>
                      <td style={td}>
                        <span style={{ fontSize: 11, color: C.muted }}>
                          {new Date(c.deleted_at).toLocaleString()}
                        </span>
                      </td>
                      <td style={td}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: urgent ? C.red : C.amber,
                        }}>
                          {days === 0 ? 'hoy' : `${days} día${days === 1 ? '' : 's'}`}
                        </span>
                      </td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => restore.mutate(c.id)}
                            disabled={restore.isPending}
                            style={btnPrimary}
                            title="Restaurar"
                          >
                            <Undo2 size={12} /> Restaurar
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar permanentemente "${c.name}"? Esta acción no se puede deshacer.`)) {
                                hardDelete.mutate(c.id)
                              }
                            }}
                            disabled={hardDelete.isPending}
                            style={btnDanger}
                            title="Eliminar permanente"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left', padding: '10px 14px',
  fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
  color: C.muted,
}
const td: React.CSSProperties = { padding: '12px 14px', verticalAlign: 'middle' }
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '5px 10px', borderRadius: 6, border: `1px solid ${C.border}`,
  background: '#FFFFFF', color: C.accent, fontSize: 11, fontWeight: 600, cursor: 'pointer',
}
const btnDanger: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '5px 7px', borderRadius: 6, border: `1px solid ${C.border}`,
  background: '#FFFFFF', color: C.red, cursor: 'pointer',
}
