import { taskStatuses, type Task, type TaskStatus } from './tasks'

export const TASK_DRAG_TYPE = 'application/x-taskora-task'
export function taskDragPayload(task: Task): string {
  return JSON.stringify({ version: 1, id: task.id, projectId: task.projectId })
}
export function resolveTaskDrop(raw: string, projectId: string, status: TaskStatus, tasks: Task[]): Task | null {
  if (!taskStatuses.some(item => item.value === status)) return null
  try {
    const payload = JSON.parse(raw)
    if (!payload || payload.version !== 1 || typeof payload.id !== 'string' || payload.projectId !== projectId) return null
    const task = tasks.find(item => item.id === payload.id && item.projectId === projectId)
    return task && task.status !== status ? task : null
  } catch {
    return null
  }
}
