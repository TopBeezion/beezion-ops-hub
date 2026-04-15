import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Campaign, CampaignFilters, CampaignStatus, CampaignType } from '../types'

export function useCampaigns(filters?: CampaignFilters) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*, client:clients(*)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (filters?.client_id) query = query.eq('client_id', filters.client_id)
      if (filters?.type) query = query.eq('type', filters.type)
      if (filters?.status) query = query.eq('status', filters.status)

      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCampaignsByClient(clientId?: string) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', 'by-client-id', clientId],
    queryFn: async () => {
      if (!clientId) return []
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, client:clients(*)')
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!clientId,
  })
}

/**
 * Selector hook: returns ONLY top-level campaigns (kind='group' or 'general').
 * Hides Main/Iteración/Refresh children which are internal sub-components of each group.
 * Use this in: task forms, filter dropdowns, anywhere a user picks a campaign for a task.
 */
export function useCampaignsForSelector(clientId?: string) {
  return useQuery<Campaign[]>({
    queryKey: ['campaigns', 'selector', clientId ?? 'all'],
    queryFn: async () => {
      let query = supabase
        .from('campaigns')
        .select('*, client:clients(*)')
        .in('kind', ['group', 'general'])
        .is('deleted_at', null)
        .order('name')
      if (clientId) query = query.eq('client_id', clientId)
      const { data, error } = await query
      if (error) throw error
      return data ?? []
    },
  })
}

export function useCampaignsGroupedByClient() {
  return useQuery<Record<string, Campaign[]>>({
    queryKey: ['campaigns', 'by-client'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, client:clients(*)')
        .is('deleted_at', null)
        .order('name')

      if (error) throw error

      const grouped: Record<string, Campaign[]> = {}
      for (const campaign of (data ?? [])) {
        const clientId = campaign.client_id
        if (!grouped[clientId]) grouped[clientId] = []
        grouped[clientId].push(campaign)
      }
      return grouped
    },
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'client' | 'tasks'>) => {
      const { data, error } = await supabase.from('campaigns').insert([campaign]).select().single()
      if (error) throw error
      return data as Campaign
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Omit<Campaign, 'client' | 'tasks'>> & { id: string }) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ ...fields, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useUpdateCampaignStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CampaignStatus }) => {
      const { error } = await supabase
        .from('campaigns')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

/**
 * Soft-delete: moves the campaign (and its sub-campaigns) to Papelera.
 * Auto-purged after 7 days by pg_cron job `purge_trashed_campaigns_daily`.
 */
export function useDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('soft_delete_campaign', { p_campaign_id: id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns', 'trashed'] })
    },
  })
}

// ─── Trash / Papelera ──────────────────────────────────────────────────
export interface TrashedCampaign extends Campaign {
  deleted_at: string
}

export function useTrashedCampaigns() {
  return useQuery<TrashedCampaign[]>({
    queryKey: ['campaigns', 'trashed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, client:clients(*)')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as TrashedCampaign[]
    },
  })
}

export function useRestoreCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('restore_campaign', { p_campaign_id: id })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}

export function useHardDeleteCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
