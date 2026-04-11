import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export function useClients() {
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('active', true)
        .order('name')
      if (error) throw error
      return data
    },
  })
}
