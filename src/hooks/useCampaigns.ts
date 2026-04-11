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
        .order('name')
      if (error) throw error
      return data ?? []
    },
    enabled: !!clientId,
  })
}

export function useCampaignsGroupedByClient() {
  return useQuery<Record<string, Campaign[]>>({
    queryKey: ['campaigns', 'by-client'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, client:clients(*)')
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
      const { error } = await supabase.from('campaigns').insert([campaign])
      if (error) throw error
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

export function useDeleteCampaign() {
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
