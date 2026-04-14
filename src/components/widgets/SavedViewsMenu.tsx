import { useState } from 'react'
import { ChevronDown, Save, Trash2 } from 'lucide-react'
import { useViewConfigs, useSaveViewConfig, useDeleteViewConfig } from '../../hooks/useViewConfigs'
import { useAuth } from '../../hooks/useAuth'
import { isAdminPlus } from '../../lib/constants'
import type { ViewConfig, ViewPage } from '../../types'

interface Props {
  page: ViewPage
  currentConfig: ViewConfig['config']
  activeViewId?: string
  onApply: (cfg: ViewConfig) => void
}

export function SavedViewsMenu({ page, currentConfig, activeViewId, onApply }: Props) {
  const { user } = useAuth()
  const canSaveGlobal = isAdminPlus(user)
  const ownerId = user?.email
  const { data: views } = useViewConfigs(page, ownerId)
  const save = useSaveViewConfig()
  const del = useDeleteViewConfig()
  const [open, setOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [name, setName] = useState('')
  const [scope, setScope] = useState<'global' | 'personal'>('personal')

  const sorted = [...(views ?? [])].sort((a, b) => (a.scope === 'global' ? -1 : 1))

  return (
    <div style={{ position: 'relative', display: 'inline-flex', gap: 6 }}>
      <button type="button" onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid #E4E7F0', backgroundColor: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151' }}>
        Vistas
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      <button type="button" onClick={() => setSaveOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 8, border: '1px solid #6366F1', backgroundColor: '#6366F1', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
        <Save size={12} /> Guardar
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50, backgroundColor: '#fff', border: '1px solid #E4E7F0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 240, padding: 4, maxHeight: 300, overflowY: 'auto' }}>
          {sorted.length === 0 && <div style={{ padding: 10, fontSize: 11, color: '#9CA3AF' }}>Sin vistas guardadas todavía</div>}
          {sorted.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, backgroundColor: activeViewId === v.id ? '#EEF2FF' : 'transparent', cursor: 'pointer' }}
              onClick={() => { onApply(v); setOpen(false) }}>
              <span style={{ flex: 1, fontSize: 12, fontWeight: activeViewId === v.id ? 700 : 500, color: '#374151' }}>{v.name}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, backgroundColor: v.scope === 'global' ? '#6366F115' : '#10B98115', color: v.scope === 'global' ? '#6366F1' : '#10B981' }}>{v.scope}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); if (confirm(`¿Eliminar vista "${v.name}"?`)) del.mutate(v.id) }}
                style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: 2 }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      {saveOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 50, backgroundColor: '#fff', border: '1px solid #E4E7F0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 10, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre de la vista"
            style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #E4E7F0', fontSize: 12 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => setScope('personal')}
              style={{ flex: 1, padding: '6px', borderRadius: 6, border: scope === 'personal' ? '1.5px solid #10B981' : '1px solid #E4E7F0', backgroundColor: scope === 'personal' ? '#10B98115' : '#fff', color: scope === 'personal' ? '#10B981' : '#6B7280', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              Personal
            </button>
            <button type="button" disabled={!canSaveGlobal}
              onClick={() => setScope('global')}
              title={!canSaveGlobal ? 'Solo admin+ pueden crear vistas globales' : ''}
              style={{ flex: 1, padding: '6px', borderRadius: 6, border: scope === 'global' ? '1.5px solid #6366F1' : '1px solid #E4E7F0', backgroundColor: scope === 'global' ? '#6366F115' : '#fff', color: scope === 'global' ? '#6366F1' : '#6B7280', fontSize: 11, fontWeight: 700, cursor: canSaveGlobal ? 'pointer' : 'not-allowed', opacity: canSaveGlobal ? 1 : 0.5 }}>
              Global
            </button>
          </div>
          <button type="button" disabled={!name.trim()} onClick={async () => {
            await save.mutateAsync({ page, name: name.trim(), config: currentConfig, scope, owner_id: scope === 'personal' ? ownerId : undefined })
            setName(''); setSaveOpen(false)
          }}
            style={{ padding: '7px', borderRadius: 6, border: 'none', backgroundColor: '#6366F1', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: name.trim() ? 1 : 0.5 }}>
            Guardar vista
          </button>
        </div>
      )}
    </div>
  )
}
