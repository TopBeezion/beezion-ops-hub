import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Client } from '../types'

export function useClients(includeInactive = false) {
  return useQuery<Client[]>({
    queryKey: ['clients', includeInactive],
    queryFn: async () => {
      let q = supabase.from('clients').select('*').order('name')
      if (!includeInactive) q = q.eq('active', true)
      const { data, error } = await q
      if (error) throw error
      return data ?? []
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<Client> & { id: string }) => {
      const { error } = await supabase.from('clients').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (client: { name: string; color: string }) => {
      const { error } = await supabase.from('clients').insert([{ ...client, active: true }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// Soft-delete: marca active=false (preserva tasks/campañas asociadas)
export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').update({ active: false }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
    },
  })
}
