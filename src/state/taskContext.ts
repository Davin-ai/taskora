import { createContext, useContext, type Dispatch } from 'react'
import type { Project } from '../data/projects'
import type { TaskAction, TaskState } from './taskState'

export interface TaskContextValue extends TaskState {
  projects: Project[]
  dispatch: Dispatch<TaskAction>
  storageError: string
}
export const TaskContext = createContext<TaskContextValue | null>(null)

export function useTasks(): TaskContextValue {
  const value = useContext(TaskContext)
  if (!value) throw new Error('useTasks requires TaskProvider')
  return value
}
