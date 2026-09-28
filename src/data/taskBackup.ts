import { parseTasks, serializeTasks } from '../state/taskState'
import type { Task } from './tasks'

export const MAX_BACKUP_BYTES = 2 * 1024 * 1024

function checkSize(text: string) {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error('The backup is too large. The maximum size is 2 MB.')
  }
}
export function createTaskBackup(tasks: Task[]): string {
  const text = serializeTasks(tasks)
  checkSize(text)
  return text
}
export function readTaskBackup(text: string): Task[] {
  checkSize(text)
  try {
    return parseTasks(text.replace(/^\uFEFF/, ''))
  } catch {
    throw new Error('This is not a valid Taskora task backup. Check the file format, task fields and project IDs.')
  }
}
export function summarizeTaskBackup(tasks: Task[]) {
  return {
    total: tasks.length,
    projects: new Set(tasks.map(task => task.projectId)).size,
    completed: tasks.filter(task => task.status === 'done').length,
    open: tasks.filter(task => task.status !== 'done').length,
  }
}
