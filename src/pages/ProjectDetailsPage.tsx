import { useRef, useState, type DragEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import TaskCard from '../components/TaskCard'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Input from '../components/ui/Input'
import { useTasks } from '../state/taskContext'
import type { TaskDraft } from '../state/taskState'
import TaskForm from '../components/TaskForm'
import Modal from '../components/ui/Modal'
import { getProjectTasks, getTaskProgress, selectTasks, taskStatuses, type TaskPriority, type Task, type TaskStatus } from '../data/tasks'
import { TASK_DRAG_TYPE, taskDragPayload, resolveTaskDrop } from '../data/taskDrag'
import './ProjectDetailsPage.css'

function ProjectDetailsContent() {
  const { tasks, projects, dispatch } = useTasks()
  const [editor, setEditor] = useState<{ task?: Task; status: TaskStatus } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null)
  const [moveMessage, setMoveMessage] = useState('')
  const [deleting, setDeleting] = useState<Task | null>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const { projectId } = useParams()
  const [params, setParams] = useSearchParams()
  const project = projects.find(item => item.id === projectId)
  const search = params.get('q') ?? ''
  const rawPriority = params.get('priority')
  const priority: 'all' | TaskPriority = rawPriority === 'high' || rawPriority === 'medium' || rawPriority === 'low' ? rawPriority : 'all'

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  if (!project) {
    return (
      <section className="project-missing">
        <Icon name="folder" />
        <h1>Project not found</h1>
        <p>This project does not exist in your workspace.</p>
        <Link to="/projects">Back to projects</Link>
      </section>
    )
  }

  const projectTasks = getProjectTasks(project.id, tasks)
  const filteredTasks = selectTasks(projectTasks, search, priority)
  function saveTask(draft: TaskDraft) {
    if (editor?.task) dispatch({ type: 'update', id: editor.task.id, draft })
    else dispatch({ type: 'add', task: { ...draft, id: crypto.randomUUID(), projectId: projectId! } })
    setEditor(null)
    setParams({}, { replace: true })
    requestAnimationFrame(() => addButton.current?.focus())
  }

  function endDrag() {
    setDraggingId(null)
    setDropTarget(null)
  }
  function startDrag(event: DragEvent<HTMLElement>, task: Task) {
    const target = event.target as HTMLElement
    if (target.closest('button, input, select, textarea, summary, a')) {
      event.preventDefault()
      return
    }
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(TASK_DRAG_TYPE, taskDragPayload(task))
    event.dataTransfer.setDragImage(event.currentTarget, 20, 20)
    setMoveMessage('')
    setDraggingId(task.id)
  }
  function dragOver(event: DragEvent<HTMLElement>, status: TaskStatus) {
    const task = projectTasks.find(item => item.id === draggingId)
    if (!task || task.status === status || !event.dataTransfer.types.includes(TASK_DRAG_TYPE)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDropTarget(status)
  }
  function dropTask(event: DragEvent<HTMLElement>, status: TaskStatus) {
    if (!draggingId) return
    event.preventDefault()
    const task = resolveTaskDrop(event.dataTransfer.getData(TASK_DRAG_TYPE), projectId!, status, tasks)
    endDrag()
    if (!task || task.id !== draggingId) return
    dispatch({ type: 'status', id: task.id, status })
    setMoveMessage(`“${task.title}” moved to ${taskStatuses.find(item => item.value === status)?.label}.`)
  }

  const completed = projectTasks.filter(task => task.status === 'done').length

  return (
    <div className="project-detail">
      <nav className="project-breadcrumb" aria-label="Breadcrumb">
        <Link to="/projects">Projects</Link><span aria-hidden="true">/</span><span aria-current="page">{project.name}</span>
      </nav>
      <header className="project-detail__header">
        <span className={`icon-tile tone-${project.color}`}><Icon name={project.icon} /></span>
        <div><h1>{project.name}</h1><p>{project.description}</p></div>
        <Button ref={addButton} className="project-add-task" onClick={() => setEditor({ status: 'todo' })}>+ Add task</Button>
      </header>
      <div className="project-detail__summary">
        <span><Icon name="check" />{completed} of {projectTasks.length} tasks completed</span>
        <div><progress value={getTaskProgress(projectTasks)} max={100} aria-label="Project completion" /><strong>{getTaskProgress(projectTasks)}%</strong></div>
      </div>
      <p id="board-move-help" className="project-detail__demo">Drag a card to another column, or use its Status menu on mobile and with a keyboard. Select a task title for details.</p>
      {moveMessage && <p className="board-move-message" role="status">{moveMessage}</p>}

      <section className="board-toolbar" aria-label="Task filters">
        <Input label="Search tasks" type="search" placeholder="Search title or assignee..."
          value={search} onChange={event => updateFilter('q', event.target.value)} />
        <label className="board-priority-filter">Priority
          <select value={priority} onChange={event => updateFilter('priority', event.target.value)}>
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        {(search || priority !== 'all') && <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>Clear filters</Button>}
      </section>
      <p className="board-result-count" role="status">Showing {filteredTasks.length} of {projectTasks.length} tasks</p>
      {filteredTasks.length === 0 && (
        <p className="board-empty-result">{projectTasks.length === 0
          ? 'This project has no tasks yet.'
          : 'No tasks match your filters. Try another search or clear the filters.'}</p>
      )}
      <div className="task-board">
        {taskStatuses.map(status => {
          const columnTasks = filteredTasks.filter(task => task.status === status.value)
          return (
            <section className={`task-column task-column--${status.value}${dropTarget === status.value ? ' task-column--drop-target' : ''}`} key={status.value}
              aria-labelledby={`column-${status.value}`}
              onDragOver={event => dragOver(event, status.value)}
              onDragLeave={event => {
                if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setDropTarget(null)
              }}
              onDrop={event => dropTask(event, status.value)}>
              <header><h2 id={`column-${status.value}`}>{status.label}</h2><span>{columnTasks.length}</span></header>
              <div className="task-column__cards">
                {columnTasks.map(task => <TaskCard key={task.id} task={task}
                  drag={{ onStart: event => startDrag(event, task), onEnd: endDrag, active: draggingId === task.id }}
                  onEdit={() => setEditor({ task, status: task.status })}
                  onDelete={() => setDeleting(task)}
                  onStatusChange={status => {
                    dispatch({ type: 'status', id: task.id, status })
                    requestAnimationFrame(() => addButton.current?.focus())
                  }} />)}
                {columnTasks.length === 0 && <p className="task-column__empty">No {search || priority !== 'all' ? 'matching ' : ''}tasks</p>}
              </div>
              <Button variant="secondary" className="column-add-task" onClick={() => setEditor({ status: status.value })}>+ Add task to {status.label}</Button>
            </section>
          )
        })}
      </div>
      {editor && <TaskForm key={editor.task?.id ?? 'new'} task={editor.task} initialStatus={editor.status}
        onSave={saveTask} onClose={() => setEditor(null)} />}
      {deleting && <Modal title="Delete task?" onClose={() => setDeleting(null)}>
        <p className="modal__description">Delete “{deleting.title}”? You can undo your last deletion while this workspace remains open.</p>
        <div className="modal__actions">
          <Button autoFocus variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button className="button--danger" onClick={() => {
            dispatch({ type: 'delete', id: deleting.id })
            setDeleting(null)
            requestAnimationFrame(() => addButton.current?.focus())
          }}>Delete task</Button>
        </div>
      </Modal>}
    </div>
  )
}

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  return <ProjectDetailsContent key={projectId} />
}
