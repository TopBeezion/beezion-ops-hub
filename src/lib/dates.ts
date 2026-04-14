// Sprint date utilities
// Sprint 1 = current ISO week's Monday, Sprint 2 = +7 days, etc.

export function getSprintStartMonday(): Date {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const MONTH_SHORT: Record<number, string> = {
  0: 'ene', 1: 'feb', 2: 'mar', 3: 'abr', 4: 'may', 5: 'jun',
  6: 'jul', 7: 'ago', 8: 'sep', 9: 'oct', 10: 'nov', 11: 'dic',
}

const DAY_SHORT: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
}

function fmt(d: Date) {
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`
}

export function getSprintDateRange(week: number): {
  start: Date
  end: Date
  label: string
  startFmt: string
  endFmt: string
} {
  const sprint1 = getSprintStartMonday()
  const start = new Date(sprint1)
  start.setDate(sprint1.getDate() + (week - 1) * 7)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    start,
    end,
    startFmt: fmt(start),
    endFmt: fmt(end),
    label: `${fmt(start)} — ${fmt(end)}`,
  }
}

export function formatFullDate(iso: string): string {
  const d = new Date(iso)
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

/**
 * Returns how many days a task is overdue.
 * - Uses due_date if set and past today.
 * - Falls back to created_at + 1 day grace period.
 * - Returns 0 if not overdue.
 */
export function getDaysOverdue(task: {
  status: string
  due_date?: string | null
  created_at: string
}): number {
  if (task.status === 'hecho') return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (task.due_date) {
    const due = new Date(task.due_date)
    due.setHours(0, 0, 0, 0)
    const diff = Math.floor((now.getTime() - due.getTime()) / 86_400_000)
    return diff > 0 ? diff : 0
  }

  // No due_date: overdue after 1 day grace from creation
  const created = new Date(task.created_at)
  created.setHours(0, 0, 0, 0)
  const diff = Math.floor((now.getTime() - created.getTime()) / 86_400_000)
  return diff > 1 ? diff - 1 : 0
}
