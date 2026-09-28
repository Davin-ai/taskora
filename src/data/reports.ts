import { CURRENT_ASSIGNEE } from './myTasks'
import type { Project } from './projects'
import { isTaskOverdue, taskStatuses, type Task } from './tasks'

export function buildReport(tasks: Task[], projects: Project[], projectId = 'all', mineOnly = false, today = new Date()) {
  const items = tasks.filter(task => (projectId === 'all' || task.projectId === projectId) &&
    (!mineOnly || task.assignee === CURRENT_ASSIGNEE))
  const completed = items.filter(task => task.status === 'done').length
  const overdue = items.filter(task => isTaskOverdue(task, today)).sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  const percentage = (count: number, total: number) => total ? Math.round(count / total * 100) : 0
  return {
    items,
    total: items.length,
    completed,
    open: items.length - completed,
    completionRate: percentage(completed, items.length),
    overdue,
    statuses: taskStatuses.map(status => ({
      ...status, count: items.filter(task => task.status === status.value).length,
    })),
    priorities: (['high', 'medium', 'low'] as const).map(priority => ({
      priority, count: items.filter(task => task.priority === priority).length,
    })),
    projects: projects.filter(project => projectId === 'all' || project.id === projectId).map(project => {
      const selected = items.filter(task => task.projectId === project.id)
      const done = selected.filter(task => task.status === 'done').length
      return { ...project, total: selected.length, completed: done, completionRate: percentage(done, selected.length),
        overdue: selected.filter(task => isTaskOverdue(task, today)).length }
    }),
  }
}

function csvCell(value: string): string {
  // Prevent spreadsheet applications from interpreting user text as a formula.
  const safe = /^[\s]*[=+@-]|^[\t\r\n]/.test(value) ? `'${value}` : value
  return `"${safe.replaceAll('"', '""')}"`
}

export function reportCsv(tasks: Task[], projects: Project[]): string {
  const rows = [
    ['Task', 'Project', 'Status', 'Priority', 'Assignee', 'Deadline', 'Description'],
    ...tasks.map(task => [
      task.title, projects.find(project => project.id === task.projectId)?.name ?? task.projectId,
      taskStatuses.find(status => status.value === task.status)?.label ?? task.status,
      task.priority, task.assignee, task.dueDate, task.description,
    ]),
  ]
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n'
}
