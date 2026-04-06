import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TeamMember } from '../types'

export function useTeam() {
  return useQuery<TeamMember[]>({
    queryKey: ['team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('name')
      if (error) throw error
      return data
    },
  })
}
