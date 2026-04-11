import { Copy, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useClients } from '../hooks/useClients'
import { useTeam } from '../hooks/useTeam'
import { AREA_COLORS } from '../lib/constants'

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
      className="p-1.5 rounded transition-colors hover:bg-[#1f2240]"
      style={{ color: copied ? '#4ade80' : '#6b7280' }}
      title="Copiar"
    >
      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
    </button>
  )
}

export function SettingsPage() {
  const { data: clients = [], isLoading: clientsLoading } = useClients()
  const { data: team = [], isLoading: teamLoading } = useTeam()

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-base font-semibold" style={{ color: '#e8e9ef' }}>Configuración</h1>
        <p className="text-xs mt-0.5" style={{ color: '#a0a6cc' }}>Gestiona clientes, equipo y conectores</p>
      </div>

      {/* Clients */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#a0a6cc' }}>
          Clientes activos
        </h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid #1f2240' }}
        >
          {clientsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            clients.map((client, idx) => (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: idx < clients.length - 1 ? '1px solid #1f2240' : undefined,
                  backgroundColor: '#13152a',
                }}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: client.color }}
                />
                <span className="text-sm flex-1" style={{ color: '#e8e9ef' }}>{client.name}</span>
                <span className="text-xs" style={{ color: '#a0a6cc' }}>{client.color}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: client.active ? '#4ade8022' : '#6b728022',
                    color: client.active ? '#4ade80' : '#6b7280',
                  }}
                >
                  {client.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Team */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#a0a6cc' }}>
          Equipo
        </h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid #1f2240' }}
        >
          {teamLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-4 h-4 border-2 border-[#f5a623] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            team.map((member, idx) => (
              <div
                key={member.id}
                className="flex items-center gap-3 px-4 py-3"
                style={{
                  borderBottom: idx < team.length - 1 ? '1px solid #1f2240' : undefined,
                  backgroundColor: '#13152a',
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{
                    backgroundColor: `${member.color}33`,
                    color: member.color,
                    border: `1px solid ${member.color}55`,
                  }}
                >
                  {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm" style={{ color: '#e8e9ef' }}>{member.name}</p>
                  {member.email && (
                    <p className="text-xs" style={{ color: '#a0a6cc' }}>{member.email}</p>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded capitalize"
                  style={{
                    backgroundColor: '#191c35',
                    color: '#a0a6cc',
                    border: '1px solid #1f2240',
                  }}
                >
                  {member.role}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Webhook n8n */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: '#a0a6cc' }}>
          Webhook n8n
        </h2>
        <p className="text-xs mb-3" style={{ color: '#a0a6cc' }}>
          Configura este endpoint en n8n para procesar transcripciones de reuniones y crear tareas automáticamente.
        </p>
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: '#13152a', border: '1px solid #1f2240' }}
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: '#a0a6cc' }}>Endpoint URL</p>
              <code
                className="text-xs break-all"
                style={{ color: '#f5a623', fontFamily: 'monospace' }}
              >
                {WEBHOOK_URL}
              </code>
            </div>
            <CopyButton text={WEBHOOK_URL} />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: '#a0a6cc' }}>Método</p>
              <span
                className="text-xs px-2 py-1 rounded font-mono"
                style={{ backgroundColor: '#191c35', color: '#4ade80' }}
              >
                POST
              </span>
            </div>

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: '#a0a6cc' }}>Headers</p>
              <div className="rounded p-2 text-xs font-mono" style={{ backgroundColor: '#191c35', color: '#818cf8' }}>
                <p>{'Authorization: Bearer <SUPABASE_SERVICE_KEY>'}</p>
                <p>{'Content-Type: application/json'}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium mb-1.5" style={{ color: '#a0a6cc' }}>Body JSON</p>
              <pre
                className="text-xs rounded p-3 overflow-auto"
                style={{ backgroundColor: '#191c35', color: '#e8e9ef', fontFamily: 'monospace' }}
              >
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
        </div>
      </section>

      {/* Area colors reference */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#a0a6cc' }}>
          Colores por área (referencia)
        </h2>
        <div className="flex gap-3 flex-wrap">
          {(['copy', 'trafico', 'tech', 'admin'] as const).map(area => (
            <div
              key={area}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ backgroundColor: '#13152a', border: '1px solid #1f2240' }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: AREA_COLORS[area] }} />
              <span className="text-xs capitalize" style={{ color: '#e8e9ef' }}>{area}</span>
              <span className="text-xs font-mono" style={{ color: '#a0a6cc' }}>{AREA_COLORS[area]}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
