import { useState, type FormEvent } from 'react'
import Button from './ui/Button'
import { useSettings } from '../state/settingsContext'
import { useProfile } from '../state/profileContext'
import { CURRENT_ASSIGNEE } from '../data/myTasks'
import Input from './ui/Input'
import Modal from './ui/Modal'
import { taskStatuses, type Task, type TaskStatus } from '../data/tasks'
import { cleanTaskDraft, validateTask, type TaskDraft, type TaskErrors } from '../state/taskState'

export default function TaskForm({ task, initialStatus = 'todo', projects, initialProjectId, onSave, onClose }: {
  task?: Task
  initialStatus?: TaskStatus
  projects?: { id: string; name: string }[]
  initialProjectId?: string
  onSave: (draft: TaskDraft, projectId?: string) => void
  onClose: () => void
}) {
  const { profile } = useProfile()
  const { settings } = useSettings()
  const [draft, setDraft] = useState<TaskDraft>(() => ({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? initialStatus,
    priority: task?.priority ?? settings.defaultPriority,
    assignee: task?.assignee ?? CURRENT_ASSIGNEE,
    dueDate: task?.dueDate ?? '',
  }))
  const [projectId, setProjectId] = useState(initialProjectId ?? '')
  const [projectError, setProjectError] = useState('')
  const [errors, setErrors] = useState<TaskErrors>({})
  function update<K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) {
    setDraft(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateTask(draft)
    setErrors(nextErrors)
    const invalidProject = projects !== undefined && !projects.some(project => project.id === projectId)
    setProjectError(invalidProject ? 'Choose a project for this task.' : '')
    if (Object.keys(nextErrors).length || invalidProject) return
    onSave(cleanTaskDraft(draft), projects ? projectId : undefined)
  }

  return (
    <Modal title={task ? 'Edit task' : 'Create task'} onClose={onClose}>
      <form className="task-form" noValidate onSubmit={submit}>
        {(projectError || Object.values(errors).some(Boolean)) && <p className="task-form__error" role="alert">Please correct the fields below.</p>}
        {projects && <label className="field">Project
          <select required value={projectId} aria-invalid={Boolean(projectError)}
            aria-describedby={projectError ? 'task-project-error' : undefined}
            onChange={event => { setProjectId(event.target.value); setProjectError('') }}>
            <option value="">Choose a project</option>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          {projectError && <span id="task-project-error" className="task-form__error">{projectError}</span>}
        </label>}
        <Input label="Title" autoFocus required maxLength={120} value={draft.title}
          onChange={event => update('title', event.target.value)} error={errors.title} />
        <label className="field">Description
          <textarea maxLength={2000} value={draft.description} onChange={event => update('description', event.target.value)} />
        </label>
        <div className="task-form__row">
          <div className="field"><label className="field">Assign to
            <select value={draft.assignee === CURRENT_ASSIGNEE ? 'me' : 'other'} onChange={event => update('assignee', event.target.value === 'me' ? CURRENT_ASSIGNEE : '')}>
              <option value="me">Me — {profile.displayName}</option><option value="other">Someone else</option>
            </select></label>
            {draft.assignee !== CURRENT_ASSIGNEE && <Input label="Assignee name" required maxLength={60} value={draft.assignee}
              onChange={event => update('assignee', event.target.value)} error={errors.assignee} />}</div>
          <Input label="Deadline" type="date" required value={draft.dueDate}
            onChange={event => update('dueDate', event.target.value)} error={errors.dueDate} />
        </div>
        <div className="task-form__row">
          <label className="field">Status
            <select value={draft.status} onChange={event => update('status', event.target.value as TaskDraft['status'])}>
              {taskStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </label>
          <label className="field">Priority
            <select value={draft.priority} onChange={event => update('priority', event.target.value as TaskDraft['priority'])}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </label>
        </div>
        <footer className="modal__actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{task ? 'Save changes' : 'Create task'}</Button>
        </footer>
      </form>
    </Modal>
  )
}
