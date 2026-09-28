import { CURRENT_ASSIGNEE } from './myTasks'
import type { Task } from './tasks'

function dateAtNoon(year: number, month: number, day: number): Date {
  const date = new Date(0)
  date.setFullYear(year, month, day)
  date.setHours(12, 0, 0, 0)
  return date
}

export function localDateKey(date: Date): string {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function readCalendarDate(value: string | null, fallback = new Date()): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00`)
    if (!Number.isNaN(date.getTime()) && localDateKey(date) === value && date.getFullYear() >= 1 && date.getFullYear() <= 9999) return date
  }
  return dateAtNoon(fallback.getFullYear(), fallback.getMonth(), fallback.getDate())
}

export function shiftCalendarMonth(date: Date, offset: number): Date {
  const target = dateAtNoon(date.getFullYear(), date.getMonth() + offset, 1)
  const lastDay = dateAtNoon(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(date.getDate(), lastDay))
  return target
}

export function calendarDays(date: Date, weekStartsOn: 0 | 1 | 6 = 1): Date[] {
  const first = dateAtNoon(date.getFullYear(), date.getMonth(), 1)
  const offset = (first.getDay() - weekStartsOn + 7) % 7
  return Array.from({ length: 42 }, (_, index) =>
    dateAtNoon(date.getFullYear(), date.getMonth(), 1 - offset + index))
}

export function calendarTasks(tasks: Task[], projectId: string, mineOnly: boolean, includeCompleted: boolean): Task[] {
  return tasks.filter(task =>
    (projectId === 'all' || task.projectId === projectId) &&
    (!mineOnly || task.assignee === CURRENT_ASSIGNEE) &&
    (includeCompleted || task.status !== 'done'))
}
