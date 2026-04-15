import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { ViewConfig, ViewPage } from '../types'

export function useViewConfigs(page: ViewPage, ownerId?: string) {
  return useQuery<ViewConfig[]>({
    queryKey: ['view_configs', page, ownerId],
    queryFn: async () => {
      let q = supabase.from('view_configs').select('*').eq('page', page)
      if (ownerId) {
        q = q.or(`scope.eq.global,owner_id.eq.${ownerId}`)
      } else {
        q = q.eq('scope', 'global')
      }
      const { data, error } = await q.order('created_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as ViewConfig[]
    },
  })
}

export function useSaveViewConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: Partial<ViewConfig> & { page: ViewPage; name: string; config: ViewConfig['config']; scope: 'global' | 'personal'; owner_id?: string }) => {
      if (v.id) {
        const { error } = await supabase.from('view_configs').update({
          name: v.name, config: v.config, scope: v.scope, owner_id: v.owner_id, updated_at: new Date().toISOString(),
        }).eq('id', v.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('view_configs').insert([{
          name: v.name, page: v.page, config: v.config, scope: v.scope, owner_id: v.owner_id,
        }])
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['view_configs'] }),
  })
}

export function useDeleteViewConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('view_configs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['view_configs'] }),
  })
}
