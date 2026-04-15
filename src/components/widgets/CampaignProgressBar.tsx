import { useCampaignProgress } from '../../hooks/useProgress'

interface Props {
  campaignId: string
  showLabel?: boolean
  compact?: boolean
}

export function CampaignProgressBar({ campaignId, showLabel = true, compact = false }: Props) {
  const { data } = useCampaignProgress(campaignId)
  const row = data?.[0]
  if (!row) return null
  const pct = Math.max(0, Math.min(100, row.progress_pct ?? 0))
  const color = pct >= 100 ? '#10B981' : pct >= 70 ? '#6366F1' : pct >= 30 ? '#F59E0B' : '#9CA3AF'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
      {showLabel && (
        <span style={{ fontSize: compact ? 10 : 11, fontWeight: 700, color: '#6B7280', minWidth: 32 }}>
          {pct}%
        </span>
      )}
      <div style={{ flex: 1, height: compact ? 4 : 6, borderRadius: 99, backgroundColor: '#E8EAF2', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: color, transition: 'width 0.3s' }} />
      </div>
      {showLabel && (
        <span style={{ fontSize: compact ? 9 : 10, color: '#9CA3AF' }}>
          {row.done_tasks}/{row.total_tasks}
        </span>
      )}
    </div>
  )
}
