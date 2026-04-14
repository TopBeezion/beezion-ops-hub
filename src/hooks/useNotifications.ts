import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface AppNotification {
  id: string
  type: 'meeting_tasks' | 'overdue_tasks'
  title: string
  body: string
  tasks: {
    id: string
    title: string
    client_name?: string
    area: string
    assignee: string
    days_overdue?: number
  }[]
  timestamp: string
  read: boolean
}

// Simple in-memory store (persists for session)
let globalNotifications: AppNotification[] = []
const listeners: Set<() => void> = new Set()

function notifyListeners() {
  listeners.forEach(fn => fn())
}

export function addNotification(n: AppNotification) {
  globalNotifications = [n, ...globalNotifications].slice(0, 50)
  notifyListeners()
}

/** Replace existing notification by id, or prepend if new */
export function upsertNotification(n: AppNotification) {
  const idx = globalNotifications.findIndex(x => x.id === n.id)
  if (idx >= 0) {
    globalNotifications = [n, ...globalNotifications.filter((_, i) => i !== idx)]
  } else {
    globalNotifications = [n, ...globalNotifications].slice(0, 50)
  }
  notifyListeners()
}

export function markAllRead() {
  globalNotifications = globalNotifications.map(n => ({ ...n, read: true }))
  notifyListeners()
}

export function useNotifications() {
  const [, forceRender] = useState(0)

  useEffect(() => {
    const fn = () => forceRender(x => x + 1)
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }, [])

  const unreadCount = globalNotifications.filter(n => !n.read).length

  return {
    notifications: globalNotifications,
    unreadCount,
    markAllRead: useCallback(() => { markAllRead(); forceRender(x => x + 1) }, []),
  }
}

// Subscribe to meeting_auto task inserts via Supabase realtime
export function useMeetingTaskWatcher() {
  useEffect(() => {
    // Track which meeting_date groups we've already notified for
    const notified = new Set<string>()

    const channel = supabase
      .channel('meeting-auto-inserts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: 'source=eq.meeting_auto',
        },
        (payload) => {
          const task = payload.new as {
            id: string; title: string; area: string; assignee: string
            meeting_date?: string; source: string
          }
          const groupKey = task.meeting_date || new Date().toISOString().slice(0, 10)

          // Batch notifications: wait 2s then group by meeting_date
          const timeoutKey = `meeting-${groupKey}`
          if ((window as unknown as Record<string, unknown>)[timeoutKey]) return
          ;(window as unknown as Record<string, unknown>)[timeoutKey] = true

          setTimeout(async () => {
            // Fetch all tasks from this meeting
            const { data } = await supabase
              .from('tasks')
              .select('id, title, area, assignee, client:clients(name)')
              .eq('source', 'meeting_auto')
              .gte('created_at', new Date(Date.now() - 10_000).toISOString())
              .order('created_at', { ascending: false })

            if (!data || data.length === 0) return
            if (notified.has(groupKey)) return
            notified.add(groupKey)

            const taskList = data.map((t: Record<string, unknown>) => ({
              id: t.id as string,
              title: t.title as string,
              area: t.area as string,
              assignee: t.assignee as string,
              client_name: (t.client as { name?: string } | null)?.name,
            }))

            addNotification({
              id: `meeting-${groupKey}-${Date.now()}`,
              type: 'meeting_tasks',
              title: `Nuevas tareas de reunión`,
              body: `Se agregaron ${taskList.length} tarea${taskList.length > 1 ? 's' : ''} al backlog`,
              tasks: taskList,
              timestamp: new Date().toISOString(),
              read: false,
            })

            delete (window as unknown as Record<string, unknown>)[timeoutKey]
          }, 2000)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])
}

// Check for overdue tasks assigned to the current user and surface them as notifications
export function useOverdueNotifier() {
  useEffect(() => {
    const stored = localStorage.getItem('beezion_user')
    if (!stored) return
    let user: { name: string } | null = null
    try { user = JSON.parse(stored) } catch { return }
    if (!user?.name) return

    const checkOverdue = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('id, title, area, assignee, status, due_date, created_at, client:clients(name)')
        .eq('assignee', user!.name)
        .neq('status', 'done')
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) return

      const now = new Date()
      now.setHours(0, 0, 0, 0)

      const overdueTasks = data
        .map((t: Record<string, unknown>) => {
          const due_date = t.due_date as string | null | undefined
          const created_at = t.created_at as string

          let days = 0
          if (due_date) {
            const due = new Date(due_date)
            due.setHours(0, 0, 0, 0)
            const diff = Math.floor((now.getTime() - due.getTime()) / 86_400_000)
            days = diff > 0 ? diff : 0
          } else {
            const created = new Date(created_at)
            created.setHours(0, 0, 0, 0)
            const diff = Math.floor((now.getTime() - created.getTime()) / 86_400_000)
            days = diff > 1 ? diff - 1 : 0
          }

          return {
            id: t.id as string,
            title: t.title as string,
            area: t.area as string,
            assignee: t.assignee as string,
            client_name: (t.client as { name?: string } | null)?.name,
            days_overdue: days,
          }
        })
        .filter(t => t.days_overdue > 0)
        .sort((a, b) => b.days_overdue - a.days_overdue)

      if (overdueTasks.length === 0) return

      const maxDays = overdueTasks[0].days_overdue
      upsertNotification({
        id: `overdue-${user!.name}`,
        type: 'overdue_tasks',
        title: `⚠️ ${overdueTasks.length} tarea${overdueTasks.length > 1 ? 's' : ''} atrasada${overdueTasks.length > 1 ? 's' : ''}`,
        body: `La más atrasada lleva ${maxDays} día${maxDays > 1 ? 's' : ''} de retraso`,
        tasks: overdueTasks,
        timestamp: new Date().toISOString(),
        read: false,
      })
    }

    checkOverdue()
    // Refresh every 10 minutes
    const interval = setInterval(checkOverdue, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])
}
