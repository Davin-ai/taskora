import { useRef, useState, type ReactNode } from 'react'
import { buildProjects } from '../data/projects'
import { tasks as seedTasks } from '../data/tasks'
import { TaskContext } from './taskContext'
import { loadTasks, serializeTasks, TASK_STORAGE_KEY, taskReducer, type StoredTasks, type TaskAction, type TaskState } from './taskState'

function readInitialTasks(): StoredTasks {
  if (typeof window === 'undefined') return { tasks: seedTasks, storageError: '', canSave: false }
  try {
    return loadTasks(window.localStorage)
  } catch {
    return { tasks: seedTasks, storageError: 'Browser storage is unavailable. Changes will last only for this session.', canSave: false }
  }
}

export default function TaskProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitialTasks)
  const [state, setState] = useState<TaskState>({ tasks: initial.tasks, deleted: null, message: '' })
  const currentState = useRef(state)
  const [storageError, setStorageError] = useState(initial.storageError)

  function dispatch(action: TaskAction) {
    const previous = currentState.current
    const next = taskReducer(previous, action)
    if (next === previous) return
    // Persist in the event handler, before navigation or reload can discard a change.
    if (next.tasks !== previous.tasks && initial.canSave) {
      try {
        window.localStorage.setItem(TASK_STORAGE_KEY, serializeTasks(next.tasks))
        setStorageError('')
      } catch {
        setStorageError('Changes could not be saved in this browser. Keep this page open; recent changes may be lost after a reload.')
      }
    }
    currentState.current = next
    setState(next)
  }

  return (
    <TaskContext.Provider value={{ ...state, dispatch, projects: buildProjects(state.tasks), storageError }}>
      {children}
    </TaskContext.Provider>
  )
}
