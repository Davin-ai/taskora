import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import TaskCard from '../components/TaskCard'
import TaskForm from '../components/TaskForm'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import { CURRENT_ASSIGNEE, getMyTasks, isTaskDueToday, readMyTaskFilters, selectMyTasks } from '../data/myTasks'
import { isTaskOverdue, taskStatuses, type Task } from '../data/tasks'
import { useTasks } from '../state/taskContext'
import type { TaskDraft } from '../state/taskState'
import './MyTasksPage.css'

export default function MyTasksPage() {
  const { tasks, projects, dispatch } = useTasks()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const addButton = useRef<HTMLButtonElement>(null)
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const filters = readMyTaskFilters(params, projects.map(project => project.id))
  const mine = getMyTasks(tasks)
  const visibleTasks = selectMyTasks(tasks, filters)
  const activeFilters = Boolean(filters.search || filters.project !== 'all' || filters.status !== 'all' ||
    filters.priority !== 'all' || filters.due !== 'all')
  const stats = [
    { label: 'Assigned to me', value: mine.length, icon: 'check' as const },
    { label: 'Due today', value: mine.filter(task => isTaskDueToday(task)).length, icon: 'calendar' as const },
    { label: 'Overdue', value: mine.filter(task => isTaskOverdue(task)).length, icon: 'clock' as const },
    { label: 'Completed', value: mine.filter(task => task.status === 'done').length, icon: 'check' as const },
  ]

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all' || (key === 'sort' && value === 'deadline')) next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  function focusHeading() {
    requestAnimationFrame(() => heading.current?.focus())
  }

  function closeCreate() {
    setCreating(false)
    requestAnimationFrame(() => addButton.current?.focus())
  }

  function createTask(draft: TaskDraft, projectId?: string) {
    if (!projectId || !projects.some(project => project.id === projectId)) return
    dispatch({ type: 'add', task: { ...draft, projectId, id: crypto.randomUUID() } })
    closeCreate()
    if (draft.assignee !== CURRENT_ASSIGNEE) navigate('/projects/' + projectId)
    else setParams({}, { replace: true })
  }

  function saveTask(draft: TaskDraft) {
    if (!editing) return
    dispatch({ type: 'update', id: editing.id, draft })
    setEditing(null)
    focusHeading()
  }

  return (
    <div className="my-tasks">
      <header className="my-tasks__heading">
        <div>
          <span className="my-tasks__eyebrow">ONE PLACE TO FOCUS</span>
          <h1 ref={heading} tabIndex={-1}>My Tasks</h1>
          <p>Your tasks across every project. Pick what matters next.</p>
        </div>
        <div className="my-tasks__actions">
          <Link className="my-tasks__projects-link" to="/projects">View projects <Icon name="arrow" /></Link>
          <Button ref={addButton} onClick={() => setCreating(true)} disabled={!projects.length}>Add task</Button>
        </div>
      </header>
      <section className="my-tasks__stats" aria-label="My task statistics">
        {stats.map(stat => <article key={stat.label}>
          <Icon name={stat.icon} /><div><strong>{stat.value}</strong><span>{stat.label}</span></div>
        </article>)}
      </section>
      <section className="my-tasks__filters" aria-label="Filter my tasks">
        <Input label="Search my tasks" type="search" placeholder="Search title or description..."
          value={filters.search} onChange={event => updateFilter('q', event.target.value)} />
        <label>Project
          <select value={filters.project} onChange={event => updateFilter('project', event.target.value)}>
            <option value="all">All projects</option>
            {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label>Status
          <select value={filters.status} onChange={event => updateFilter('status', event.target.value)}>
            <option value="all">All statuses</option>
            {taskStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label>Priority
          <select value={filters.priority} onChange={event => updateFilter('priority', event.target.value)}>
            <option value="all">All priorities</option>
            <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </label>
        <label>Deadline
          <select value={filters.due} onChange={event => updateFilter('due', event.target.value)}>
            <option value="all">Any deadline</option>
            <option value="today">Due today</option><option value="overdue">Overdue</option><option value="upcoming">Upcoming</option>
          </select>
        </label>
        <label>Sort by
          <select value={filters.sort} onChange={event => updateFilter('sort', event.target.value)}>
            <option value="deadline">Earliest deadline</option>
            <option value="priority">Highest priority</option><option value="title">Title A–Z</option>
          </select>
        </label>
      </section>
      <div className="my-tasks__results">
        <p role="status">Showing {visibleTasks.length} of {mine.length} assigned tasks</p>
        {(activeFilters || filters.sort !== 'deadline') &&
          <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>Reset filters</Button>}
      </div>
      {visibleTasks.length > 0 ? (
        <section className="my-tasks__grid" aria-label="My task list">
          {visibleTasks.map(task => {
            const project = projects.find(item => item.id === task.projectId)
            return (
              <div className="my-tasks__item" key={task.id}>
                <Link className="my-tasks__project" to={`/projects/${task.projectId}`}>
                  <Icon name={project?.icon ?? 'folder'} />{project?.name ?? 'Open project'}
                </Link>
                <TaskCard task={task} onEdit={() => setEditing(task)} onDelete={() => setDeleting(task)}
                  onStatusChange={status => {
                    dispatch({ type: 'status', id: task.id, status })
                    if (filters.status !== 'all' || filters.due !== 'all') focusHeading()
                  }} />
              </div>
            )
          })}
        </section>
      ) : (
        <section className="my-tasks__empty">
          <Icon name={mine.length ? 'search' : 'check'} />
          <h2>{mine.length ? 'No matching tasks' : 'No tasks assigned to you yet'}</h2>
          <p>{mine.length ? 'Try a different search or reset the filters.' : 'Create a task and assign it to yourself to get started.'}</p>
          {activeFilters
            ? <Button onClick={() => setParams({}, { replace: true })}>Show all my tasks</Button>
            : <Link to="/projects">Explore projects</Link>}
        </section>
      )}
      {creating && <TaskForm projects={projects} initialProjectId={filters.project === 'all' ? undefined : filters.project}
        onSave={createTask} onClose={closeCreate} />}
      {editing && <TaskForm key={editing.id} task={editing} onSave={saveTask} onClose={() => setEditing(null)} />}
      {deleting && <Modal title="Delete task?" onClose={() => setDeleting(null)}>
        <p className="modal__description">Delete “{deleting.title}”? You can undo your last deletion while this workspace remains open.</p>
        <div className="modal__actions">
          <Button autoFocus variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button className="button--danger" onClick={() => {
            dispatch({ type: 'delete', id: deleting.id })
            setDeleting(null)
            focusHeading()
          }}>Delete task</Button>
        </div>
      </Modal>}
    </div>
  )
}
