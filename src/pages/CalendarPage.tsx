import { Link, useSearchParams } from 'react-router-dom'
import { useRef, useState } from 'react'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import TaskCard from '../components/TaskCard'
import TaskForm from '../components/TaskForm'
import Modal from '../components/ui/Modal'
import { calendarDays, calendarTasks, localDateKey, readCalendarDate, shiftCalendarMonth } from '../data/calendar'
import { isTaskOverdue, type Task } from '../data/tasks'
import { useTasks } from '../state/taskContext'
import type { TaskDraft } from '../state/taskState'
import { useSettings } from '../state/settingsContext'
import { calendarCompletionFilter } from '../data/settings'
import './CalendarPage.css'

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const fullDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

export default function CalendarPage() {
  const { settings } = useSettings()
  const orderedWeekdays = [...weekdays.slice(settings.weekStartsOn), ...weekdays.slice(0, settings.weekStartsOn)]
  const { tasks, projects, dispatch } = useTasks()
  const [params, setParams] = useSearchParams()
  const [editing, setEditing] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const selected = readCalendarDate(params.get('date'))
  const selectedKey = localDateKey(selected)
  const todayKey = localDateKey(new Date())
  const rawProject = params.get('project')
  const project = projects.some(item => item.id === rawProject) ? rawProject! : 'all'
  const mineOnly = params.get('owner') === 'me'
  const includeCompleted = calendarCompletionFilter(params.get('completed'), settings)
  const visibleTasks = calendarTasks(tasks, project, mineOnly, includeCompleted)
  const dayTasks = visibleTasks.filter(task => task.dueDate === selectedKey)
  const monthKey = selectedKey.slice(0, 7)
  const monthCount = visibleTasks.filter(task => task.dueDate.startsWith(monthKey)).length
  const agendaHeading = useRef<HTMLHeadingElement>(null)

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }
  function selectDate(date: Date) {
    if (date.getFullYear() < 1 || date.getFullYear() > 9999) return
    updateParam('date', localDateKey(date))
  }
  function focusAgenda() {
    requestAnimationFrame(() => agendaHeading.current?.focus())
  }
  function saveTask(draft: TaskDraft) {
    if (!editing) return
    dispatch({ type: 'update', id: editing.id, draft })
    setEditing(null)
    // Follow a changed deadline so the edited task is easy to find.
    const next = new URLSearchParams(params)
    next.set('date', draft.dueDate)
    if (draft.status === 'done') next.set('completed', 'yes')
    next.delete('owner')
    setParams(next, { replace: true })
    focusAgenda()
  }

  return (
    <div className="calendar-page">
      <header className="calendar-page__heading">
        <span>MAKE ROOM FOR WHAT'S NEXT</span>
        <h1>Calendar</h1>
        <p>See your deadlines at a glance and plan one day at a time.</p>
      </header>
      <section className="calendar-filters" aria-label="Calendar filters">
        <label>Project
          <select value={project} onChange={event => updateParam('project', event.target.value)}>
            <option value="all">All projects</option>
            {projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="calendar-checkbox"><input type="checkbox" checked={mineOnly}
          onChange={event => updateParam('owner', event.target.checked ? 'me' : '')} />Only my tasks</label>
        <label className="calendar-checkbox"><input type="checkbox" checked={includeCompleted}
          onChange={event => updateParam('completed', event.target.checked ? 'yes' : 'no')} />Show completed</label>
      </section>
      <section className="month-panel" aria-labelledby="calendar-month">
        <header className="month-panel__heading">
          <div><h2 id="calendar-month">{monthFormat.format(selected)}</h2><p>{monthCount} tasks due this month</p></div>
          <div className="month-controls">
            <Button variant="secondary" aria-label="Previous month"
              disabled={selected.getFullYear() === 1 && selected.getMonth() === 0}
              onClick={() => selectDate(shiftCalendarMonth(selected, -1))}>‹</Button>
            <Button variant="secondary" onClick={() => selectDate(new Date())}>Today</Button>
            <Button variant="secondary" aria-label="Next month"
              disabled={selected.getFullYear() === 9999 && selected.getMonth() === 11}
              onClick={() => selectDate(shiftCalendarMonth(selected, 1))}>›</Button>
          </div>
        </header>
        <div className="calendar-weekdays" aria-hidden="true">{orderedWeekdays.map(day => <span key={day}>{day}</span>)}</div>
        <div className="calendar-month" role="group" aria-label={`Choose a date in ${monthFormat.format(selected)}`}>
          {calendarDays(selected, settings.weekStartsOn).map(date => {
            const key = localDateKey(date)
            const items = visibleTasks.filter(task => task.dueDate === key)
            const outside = date.getMonth() !== selected.getMonth()
            const overdue = items.some(task => isTaskOverdue(task))
            return (
              <button key={key} type="button"
                className={`calendar-day${outside ? ' calendar-day--outside' : ''}${key === todayKey ? ' calendar-day--today' : ''}`}
                disabled={date.getFullYear() < 1 || date.getFullYear() > 9999}
                aria-pressed={key === selectedKey} aria-current={key === todayKey ? 'date' : undefined}
                aria-label={`${fullDate.format(date)}, ${items.length} tasks${overdue ? ', overdue tasks' : ''}`}
                onClick={() => selectDate(date)}>
                <span className="calendar-day__number">{date.getDate()}</span>
                {items.length > 0 && <>
                  <span className={`calendar-day__count${overdue ? ' calendar-day__count--overdue' : ''}`}>{items.length}<span className="calendar-day__word"> tasks</span></span>
                  <span className="calendar-day__preview">{items[0].title}</span>
                </>}
              </button>
            )
          })}
        </div>
      </section>
      <section className="calendar-agenda" aria-labelledby="agenda-heading">
        <header>
          <div><h2 id="agenda-heading" ref={agendaHeading} tabIndex={-1}>{fullDate.format(selected)}</h2>
            <p role="status">{dayTasks.length} tasks for this day</p></div>
          <Link to="/projects">Open projects <Icon name="arrow" /></Link>
        </header>
        {dayTasks.length ? <div className="calendar-agenda__tasks">
          {dayTasks.map(task => (
            <div key={task.id}>
              <Link className="calendar-project-link" to={`/projects/${task.projectId}`}>
                {projects.find(item => item.id === task.projectId)?.name ?? 'Open project'}
              </Link>
              <TaskCard task={task} onEdit={() => setEditing(task)} onDelete={() => setDeleting(task)}
                onStatusChange={status => { dispatch({ type: 'status', id: task.id, status }); focusAgenda() }} />
            </div>
          ))}
        </div> : <div className="calendar-empty"><Icon name="calendar" /><h3>No tasks due on this day</h3>
          <p>Select another day or adjust your filters.</p></div>}
      </section>
      {editing && <TaskForm key={editing.id} task={editing} onSave={saveTask} onClose={() => setEditing(null)} />}
      {deleting && <Modal title="Delete task?" onClose={() => setDeleting(null)}>
        <p className="modal__description">Delete “{deleting.title}”? You can undo your last deletion while this workspace remains open.</p>
        <div className="modal__actions">
          <Button autoFocus variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button className="button--danger" onClick={() => {
            dispatch({ type: 'delete', id: deleting.id })
            setDeleting(null)
            focusAgenda()
          }}>Delete task</Button>
        </div>
      </Modal>}
    </div>
  )
}
