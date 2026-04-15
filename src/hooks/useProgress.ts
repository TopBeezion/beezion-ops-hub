import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { CampaignProgressRow, TeamCapacityRow } from '../types'

export function useCampaignProgress(campaignId?: string) {
  return useQuery<CampaignProgressRow[]>({
    queryKey: ['campaign_progress', campaignId],
    queryFn: async () => {
      let q = supabase.from('campaign_progress').select('*')
      if (campaignId) q = q.eq('campaign_id', campaignId)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as CampaignProgressRow[]
    },
  })
}

export function useTeamCapacity(enabled = true) {
  return useQuery<TeamCapacityRow[]>({
    queryKey: ['team_capacity'],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from('team_capacity').select('*')
      if (error) throw error
      return (data ?? []) as TeamCapacityRow[]
    },
  })
}
