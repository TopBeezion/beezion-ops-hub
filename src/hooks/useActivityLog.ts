import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { TaskActivityEntry } from '../types'

export function useTaskActivityLog(taskId?: string) {
  return useQuery<TaskActivityEntry[]>({
    queryKey: ['task_activity_log', taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_activity_log')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data ?? []) as TaskActivityEntry[]
    },
  })
}
