import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface ClientStrategy {
  client_id: string
  problems: string[]
  strategies: string[]
  kpis: string[]
  updated_at?: string
  updated_by?: string | null
}

export function useClientStrategy(clientId?: string) {
  return useQuery<ClientStrategy | null>({
    queryKey: ['client_strategy', clientId],
    queryFn: async () => {
      if (!clientId) return null
      const { data, error } = await supabase
        .from('client_strategies')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle()
      if (error) throw error
      return data ?? null
    },
    enabled: !!clientId,
  })
}

export function useUpsertClientStrategy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { client_id: string; problems: string[]; strategies: string[]; kpis: string[]; updated_by?: string }) => {
      const { error } = await supabase.from('client_strategies').upsert({
        client_id: input.client_id,
        problems: input.problems,
        strategies: input.strategies,
        kpis: input.kpis,
        updated_by: input.updated_by ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id' })
      if (error) throw error
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ['client_strategy', v.client_id] })
    },
  })
}
