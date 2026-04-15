import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CampaignTemplate } from '../types'

export function useCampaignTemplates() {
  return useQuery<CampaignTemplate[]>({
    queryKey: ['campaign_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('campaign_templates').select('*').order('name')
      if (error) throw error
      return (data ?? []) as CampaignTemplate[]
    },
  })
}

export function useApplyCampaignTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ campaignId, templateKey }: { campaignId: string; templateKey?: string }) => {
      const { data, error } = await supabase.rpc('apply_campaign_template', {
        p_campaign_id: campaignId,
        p_template_key: templateKey ?? null,
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
