import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import { useCampaignsByClient, useCreateCampaign } from '../hooks/useCampaigns'
import { useTasks } from '../hooks/useTasks'
import {
  CAMPAIGN_CATEGORY_LABELS, CAMPAIGN_CATEGORY_ICONS,
  CAMPAIGN_STATUS_DOT, CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_COLORS,
} from '../lib/constants'
import type { Campaign, CampaignCategory } from '../types'

export function FolderPage() {
  const { clientId = '', category = '' } = useParams<{ clientId: string; category: string }>()
  const navigate = useNavigate()
  const { data: clients = [] } = useClients()
  const { data: allCamps = [] } = useCampaignsByClient(clientId)
  const { data: tasks = [] } = useTasks({ client_id: clientId })
  const createCampaign = useCreateCampaign()

  const client = clients.find(c => c.id === clientId)
  const cat = category as CampaignCategory
  const groups = allCamps
    .filter(c => c.kind === 'group' && c.category === cat)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const childrenOf = (parentId: string) =>
    allCamps
      .filter(c => c.parent_campaign_id === parentId)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

  const taskCountFor = (campId: string) => tasks.filter(t => t.campaign_id === campId).length

  const handleCreate = async () => {
    const name = window.prompt('Nombre de la nueva campaña:')
    if (!name?.trim()) return
    try {
      await createCampaign.mutateAsync({
        client_id: clientId,
        name: name.trim(),
        type: 'nueva_campana',
        status: 'activa',
        category: cat,
        kind: 'group',
      } as Parameters<typeof createCampaign.mutateAsync>[0])
    } catch (e) {
      alert(`Error: ${(e as { message?: string })?.message ?? e}`)
    }
  }

  if (!client) return <div style={{ padding: 24 }}>Cliente no encontrado</div>

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: '#5A5E72' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5A5E72', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          <ArrowLeft size={14} /> Volver
        </button>
        <span>/</span>
        <Link to={`/clients/${clientId}`} style={{ color: '#5A5E72', textDecoration: 'none' }}>{client.name}</Link>
        <span>/</span>
        <span style={{ color: '#1A1D27', fontWeight: 600 }}>{CAMPAIGN_CATEGORY_LABELS[cat]}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#1A1D27', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26 }}>{CAMPAIGN_CATEGORY_ICONS[cat]}</span>
          {CAMPAIGN_CATEGORY_LABELS[cat]}
          <span style={{ fontSize: 13, fontWeight: 500, color: '#9699B0' }}>— {client.name}</span>
        </h1>
        {cat !== 'archivado' && (
          <button
            onClick={handleCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8,
              background: '#6366F1', color: 'white', border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Nueva campaña
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', color: '#9699B0',
          border: '2px dashed #E4E7F0', borderRadius: 12,
        }}>
          <p style={{ fontSize: 14, margin: 0 }}>
            {cat === 'archivado'
              ? 'No hay campañas archivadas. Arrastra campañas aquí desde el sidebar para archivarlas.'
              : 'No hay campañas todavía. Crea la primera.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {groups.map(camp => <GroupCard key={camp.id} camp={camp} children={childrenOf(camp.id)} taskCountFor={taskCountFor} />)}
        </div>
      )}
    </div>
  )
}

function GroupCard({ camp, children, taskCountFor }: { camp: Campaign; children: Campaign[]; taskCountFor: (id: string) => number }) {
  const color = CAMPAIGN_TYPE_COLORS[camp.type] ?? '#6366F1'
  return (
    <div style={{
      border: '1px solid #E4E7F0', borderRadius: 12,
      background: 'white', overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <Link
        to={`/campaigns/${camp.id}`}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', textDecoration: 'none',
          borderBottom: '1px solid #F0F2F7',
          color: '#1A1D27',
        }}
      >
        <div style={{ width: 4, height: 22, borderRadius: 2, background: color }} />
        <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{camp.name}</span>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: CAMPAIGN_STATUS_DOT[camp.status],
        }} title={CAMPAIGN_STATUS_LABELS[camp.status]} />
      </Link>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {children.map(kid => (
          <Link
            key={kid.id}
            to={`/campaigns/${kid.id}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 16px', textDecoration: 'none',
              color: '#5A5E72', fontSize: 13,
              borderTop: '1px solid #F5F6FA',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: CAMPAIGN_TYPE_COLORS[kid.type] ?? '#9699B0',
            }} />
            <span style={{ flex: 1, fontWeight: 500 }}>{kid.name}</span>
            <span style={{ fontSize: 11, color: '#9699B0' }}>{taskCountFor(kid.id)} tareas</span>
            <ChevronRight size={14} color="#9699B0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
