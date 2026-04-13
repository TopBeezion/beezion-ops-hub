import { Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useClients } from '../hooks/useClients'
import { useTeam } from '../hooks/useTeam'
import { AREA_COLORS, AREA_LABELS } from '../lib/constants'

const C = {
  bg: '#F0F2F8',
  card: '#FFFFFF',
  border: '#E4E7F0',
  text: '#1A1D27',
  sub: '#5A5E72',
  muted: '#9699B0',
}

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL ?? 'https://YOUR_PROJECT.supabase.co'}/functions/v1/process-meeting`

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px', borderRadius: 6, cursor: 'pointer',
        color: copied ? '#10B981' : C.muted,
        backgroundColor: copied ? '#D1FAE5' : C.bg,
        border: `1px solid ${copied ? '#86EFAC' : C.border}`,
        transition: 'all 0.2s',
      }}
      title="Copiar"
    >
      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
    </button>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.06em', color: C.muted, marginBottom: 10,
    }}>
      {children}
    </h2>
  )
}

export function SettingsPage() {
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: team = [], isLoading: teamLoading } = useTeam()

  return (
    <div style={{ backgroundColor: C.bg, minHeight: '100%', padding: '20px 24px' }}>
      <div style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Header */}
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: 0 }}>Configuración</h1>
          <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>Gestiona clientes, equipo y conectores</p>
        </div>

        {/* ── Clients ── */}
        <section>
          <SectionTitle>Clientes activos</SectionTitle>
          <div style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            {clientsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" style={{ color: '#6366F1' }} />
              </div>
            ) : clients.map((client, idx) => (
              <div key={client.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                borderBottom: idx < clients.length - 1 ? `1px solid ${C.border}` : 'none',
                borderLeft: `3px solid ${client.color}`,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: client.color,
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{client.name}</span>
                <span style={{ fontSize: 11, color: C.muted, fontFamily: 'monospace' }}>{client.color}</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                  backgroundColor: client.active ? '#D1FAE5' : '#F3F4F6',
                  color: client.active ? '#10B981' : C.muted,
                  border: `1px solid ${client.active ? '#86EFAC' : C.border}`,
                }}>
                  {client.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Team ── */}
        <section>
          <SectionTitle>Equipo</SectionTitle>
          <div style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            {teamLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                <div className="w-5 h-5 border-2 border-transparent border-t-current rounded-full animate-spin" style={{ color: '#6366F1' }} />
              </div>
            ) : team.map((member, idx) => (
              <div key={member.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px',
                borderBottom: idx < team.length - 1 ? `1px solid ${C.border}` : 'none',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: `${member.color}20`,
                  color: member.color, fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `1px solid ${member.color}30`,
                }}>
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{member.name}</p>
                  {member.email && (
                    <p style={{ fontSize: 11, color: C.muted }}>{member.email}</p>
                  )}
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 6,
                  backgroundColor: C.bg, color: C.sub,
                  border: `1px solid ${C.border}`,
                }}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Webhook n8n ── */}
        <section>
          <SectionTitle>Webhook n8n</SectionTitle>
          <p style={{ fontSize: 12, color: C.muted, marginBottom: 10, marginTop: -4 }}>
            Configura este endpoint en n8n para procesar transcripciones y crear tareas automáticamente.
          </p>
          <div style={{
            backgroundColor: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {/* Endpoint */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 4 }}>Endpoint URL</p>
                <code style={{
                  fontSize: 11, color: '#6366F1', fontFamily: 'monospace',
                  backgroundColor: '#EEF2FF', padding: '4px 8px', borderRadius: 6,
                  border: '1px solid #C7D2FE', display: 'block', wordBreak: 'break-all',
                }}>
                  {WEBHOOK_URL}
                </code>
              </div>
              <CopyButton text={WEBHOOK_URL} />
            </div>

            {/* Método */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Método</p>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 700,
                backgroundColor: '#D1FAE5', color: '#10B981', border: '1px solid #86EFAC',
              }}>
                POST
              </span>
            </div>

            {/* Headers */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Headers</p>
              <div style={{
                padding: '10px 12px', borderRadius: 8, fontSize: 11, fontFamily: 'monospace',
                backgroundColor: '#F8F9FC', border: `1px solid ${C.border}`, color: '#6366F1',
                lineHeight: 1.8,
              }}>
                <p>Authorization: Bearer {'<SUPABASE_SERVICE_KEY>'}</p>
                <p>Content-Type: application/json</p>
              </div>
            </div>

            {/* Body */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 5 }}>Body JSON</p>
              <pre style={{
                fontSize: 11, borderRadius: 8, padding: '10px 12px', overflow: 'auto',
                backgroundColor: '#F8F9FC', border: `1px solid ${C.border}`,
                color: C.text, fontFamily: 'monospace', lineHeight: 1.7, margin: 0,
              }}>
{`{
  "meeting_title": "Reunión semanal equipo",
  "meeting_date": "2025-04-07",
  "transcript": "...",
  "tasks": [
    {
      "title": "Crear BCL para cliente X",
      "client_name": "Dapta",
      "area": "copy",
      "assignee": "Alejandro",
      "priority": "alta",
      "week": 1,
      "tipo": "nuevo",
      "problema": "Conversión baja"
    }
  ]
}`}
              </pre>
            </div>
          </div>
        </section>

        {/* ── Area colors reference ── */}
        <section>
          <SectionTitle>Colores por área</SectionTitle>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['copy', 'trafico', 'tech', 'admin'] as const).map(area => (
              <div key={area} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 8,
                backgroundColor: C.card, border: `1px solid ${C.border}`,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: AREA_COLORS[area] }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{AREA_LABELS[area]}</span>
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: C.muted }}>{AREA_COLORS[area]}</span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  )
}
