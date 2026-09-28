import { tasks as seedTasks, taskStatuses, type Task } from '../data/tasks'
import { projectDefinitions } from '../data/projects'

export type TaskDraft = Omit<Task, 'id' | 'projectId'>
export type TaskErrors = Partial<Record<keyof TaskDraft, string>>
export const TASK_STORAGE_KEY = 'taskora.tasks.v1'

export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) &&
    date.getFullYear() === Number(value.slice(0, 4)) &&
    date.getMonth() + 1 === Number(value.slice(5, 7)) &&
    date.getDate() === Number(value.slice(8, 10))
}

export function validateTask(draft: TaskDraft): TaskErrors {
  const errors: TaskErrors = {}
  if (!draft.title.trim()) errors.title = 'Enter a task title.'
  else if (draft.title.trim().length > 120) errors.title = 'Use 120 characters or fewer.'
  if (draft.description.length > 2000) errors.description = 'Use 2,000 characters or fewer.'
  if (!draft.assignee.trim()) errors.assignee = 'Enter an assignee.'
  else if (draft.assignee.trim().length > 60) errors.assignee = 'Use 60 characters or fewer.'
  if (!isValidDate(draft.dueDate)) errors.dueDate = 'Choose a valid deadline.'
  if (!taskStatuses.some(status => status.value === draft.status)) errors.status = 'Choose a valid status.'
  if (!['high', 'medium', 'low'].includes(draft.priority)) errors.priority = 'Choose a valid priority.'
  return errors
}

export function cleanTaskDraft(draft: TaskDraft): TaskDraft {
  return {
    title: draft.title.trim(), description: draft.description.trim(), assignee: draft.assignee.trim(),
    status: draft.status, priority: draft.priority, dueDate: draft.dueDate,
  }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') return false
  const task = value as Task
  if (!['id', 'projectId', 'title', 'description', 'status', 'priority', 'assignee', 'dueDate']
    .every(key => typeof (value as Record<string, unknown>)[key] === 'string')) return false
  return task.id.length > 0 && projectDefinitions.some(project => project.id === task.projectId) &&
    Object.keys(validateTask(task)).length === 0
}

export function serializeTasks(tasks: Task[]): string {
  return JSON.stringify({ version: 1, tasks })
}

export function parseTasks(raw: string): Task[] {
  const data: unknown = JSON.parse(raw)
  if (!data || typeof data !== 'object') throw new Error('Invalid saved workspace')
  const snapshot = data as { version?: unknown; tasks?: unknown }
  if (snapshot.version !== 1 || !Array.isArray(snapshot.tasks) || !snapshot.tasks.every(isTask)) {
    throw new Error('Invalid saved workspace')
  }
  const tasks = snapshot.tasks as Task[]
  if (new Set(tasks.map(task => task.id)).size !== tasks.length) throw new Error('Duplicate task IDs')
  return tasks
}

export interface StoredTasks {
  tasks: Task[]
  storageError: string
  canSave: boolean
}

export function loadTasks(storage: Pick<Storage, 'getItem'>): StoredTasks {
  try {
    const raw = storage.getItem(TASK_STORAGE_KEY)
    return { tasks: raw === null ? seedTasks : parseTasks(raw), storageError: '', canSave: true }
  } catch {
    return {
      tasks: seedTasks,
      storageError: 'Saved tasks could not be read. Sample tasks are shown; changes will last only for this session. Existing saved data has not been replaced.',
      canSave: false,
    }
  }
}

export interface TaskState {
  tasks: Task[]
  deleted: { task: Task; index: number } | null
  message: string
}
export type TaskAction =
  | { type: 'add'; task: Task }
  | { type: 'update'; id: string; draft: TaskDraft }
  | { type: 'status'; id: string; status: Task['status'] }
  | { type: 'delete'; id: string }
  | { type: 'undo' }
  | { type: 'dismiss' }
  | { type: 'replace'; tasks: Task[] }

export function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'add':
      if (!isTask(action.task) || state.tasks.some(task => task.id === action.task.id)) return state
      return { ...state, tasks: [...state.tasks, { ...action.task, ...cleanTaskDraft(action.task) }], message: 'Task created.' }
    case 'update':
      if (Object.keys(validateTask(action.draft)).length || !state.tasks.some(task => task.id === action.id)) return state
      return { ...state, tasks: state.tasks.map(task => task.id === action.id ? { ...task, ...cleanTaskDraft(action.draft) } : task), message: 'Task updated.' }
    case 'status':
      if (!taskStatuses.some(status => status.value === action.status) || !state.tasks.some(task => task.id === action.id)) return state
      return { ...state, tasks: state.tasks.map(task => task.id === action.id ? { ...task, status: action.status } : task), message: 'Task status updated.' }
    case 'delete': {
      const index = state.tasks.findIndex(task => task.id === action.id)
      if (index < 0) return state
      return { tasks: state.tasks.filter(task => task.id !== action.id), deleted: { task: state.tasks[index], index }, message: 'Task deleted. You can undo your last deletion.' }
    }
    case 'undo': {
      if (!state.deleted || state.tasks.some(task => task.id === state.deleted?.task.id)) return state
      const tasks = [...state.tasks]
      tasks.splice(state.deleted.index, 0, state.deleted.task)
      return { tasks, deleted: null, message: 'Deleted task restored.' }
    }
    case 'replace': {
      try {
        const tasks = parseTasks(serializeTasks(action.tasks)).map(task => ({ id: task.id, projectId: task.projectId, ...cleanTaskDraft(task) }))
        return { tasks, deleted: null, message: 'Task backup imported.' }
      } catch {
        return state
      }
    }
    case 'dismiss':
      return { ...state, message: '' }
  }
}
