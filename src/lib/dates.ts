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
