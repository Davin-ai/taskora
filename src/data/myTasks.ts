import { isTaskOverdue, type Task, type TaskPriority, type TaskStatus } from './tasks'

export const CURRENT_ASSIGNEE = 'Kosar'

export interface MyTaskFilters {
  search: string
  project: string
  status: 'all' | TaskStatus
  priority: 'all' | TaskPriority
  due: 'all' | 'today' | 'overdue' | 'upcoming'
  sort: 'deadline' | 'priority' | 'title'
}

export function readMyTaskFilters(params: URLSearchParams, projectIds: string[]): MyTaskFilters {
  const status = params.get('status')
  const priority = params.get('priority')
  const due = params.get('due')
  const sort = params.get('sort')
  const project = params.get('project') ?? 'all'
  return {
    search: params.get('q') ?? '',
    project: projectIds.includes(project) ? project : 'all',
    status: status === 'todo' || status === 'in-progress' || status === 'done' ? status : 'all',
    priority: priority === 'high' || priority === 'medium' || priority === 'low' ? priority : 'all',
    due: due === 'today' || due === 'overdue' || due === 'upcoming' ? due : 'all',
    sort: sort === 'priority' || sort === 'title' ? sort : 'deadline',
  }
}

export function getMyTasks(tasks: Task[]): Task[] {
  return tasks.filter(task => task.assignee === CURRENT_ASSIGNEE)
}

export function isTaskDueToday(task: Task, today = new Date()): boolean {
  const date = new Date(`${task.dueDate}T00:00:00`)
  return task.status !== 'done' && date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() && date.getDate() === today.getDate()
}

export function selectMyTasks(tasks: Task[], filters: MyTaskFilters, today = new Date()): Task[] {
  const query = filters.search.trim().toLowerCase()
  const result = getMyTasks(tasks).filter(task => {
    if (filters.project !== 'all' && task.projectId !== filters.project) return false
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (!`${task.title} ${task.description}`.toLowerCase().includes(query)) return false
    if (filters.due === 'overdue') return isTaskOverdue(task, today)
    if (filters.due === 'today') return isTaskDueToday(task, today)
    if (filters.due === 'upcoming') {
      return task.status !== 'done' && !isTaskOverdue(task, today) && !isTaskDueToday(task, today)
    }
    return true
  })
  const priorityRank = { high: 0, medium: 1, low: 2 }
  return result.sort((a, b) => {
    if (filters.sort === 'title') return a.title.localeCompare(b.title)
    if (filters.sort === 'priority') {
      return priorityRank[a.priority] - priorityRank[b.priority] || a.dueDate.localeCompare(b.dueDate)
    }
    return a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title)
  })
}
