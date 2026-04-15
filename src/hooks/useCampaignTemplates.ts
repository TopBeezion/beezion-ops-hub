import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Area, Etapa } from '../types'

export interface CampaignTemplateTask {
  title: string
  etapa?: Etapa | null
  area?: Area | null
}

export interface CampaignTemplateRow {
  id: string
  tipo: string
  name: string
  default_tasks: CampaignTemplateTask[]
  has_objetivo: boolean
  has_revision_final: boolean
  created_at: string
}

export function useCampaignTemplates() {
  return useQuery<CampaignTemplateRow[]>({
    queryKey: ['campaign_templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_templates')
        .select('*')
        .order('name')
      if (error) throw error
      return (data ?? []) as CampaignTemplateRow[]
    },
  })
}

/**
 * Calls RPC apply_campaign_template(p_campaign_id uuid).
 * The RPC reads campaigns.type and applies the matching campaign_templates row by `tipo`.
 */
export function useApplyCampaignTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ campaignId }: { campaignId: string }) => {
      const { data, error } = await supabase.rpc('apply_campaign_template', {
        p_campaign_id: campaignId,
      })
      if (error) throw error
      return data as number
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      qc.invalidateQueries({ queryKey: ['campaigns'] })
      qc.invalidateQueries({ queryKey: ['campaign_progress'] })
    },
  })
}

/**
 * Ensures Main / Iteración / Refresh sub-campaigns exist for a group campaign.
 * Returns the Main sub-campaign id.
 */
export function useEnsureGroupChildren() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (groupId: string) => {
      const { data, error } = await supabase.rpc('ensure_group_children', { p_group_id: groupId })
      if (error) throw error
      return data as string
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

/** Update default_tasks of a template row. Allows the user to edit templates. */
export function useUpdateCampaignTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      default_tasks,
      name,
    }: { id: string; default_tasks?: CampaignTemplateTask[]; name?: string }) => {
      const patch: Record<string, unknown> = {}
      if (default_tasks !== undefined) patch.default_tasks = default_tasks
      if (name !== undefined) patch.name = name
      const { error } = await supabase
        .from('campaign_templates')
        .update(patch)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaign_templates'] }) },
  })
}
