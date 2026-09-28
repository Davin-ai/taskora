import type { DragEventHandler } from 'react'
import './TaskCard.css'
import { useProfile } from '../state/profileContext'
import { CURRENT_ASSIGNEE } from '../data/myTasks'
import Icon from './ui/Icon'
import Button from './ui/Button'
import { formatTaskDate, isTaskOverdue, taskStatuses, type Task, type TaskStatus } from '../data/tasks'

export default function TaskCard({ task, onEdit, onDelete, onStatusChange, drag }: {
  drag?: {
    onStart: DragEventHandler<HTMLElement>
    onEnd: DragEventHandler<HTMLElement>
    active: boolean
  }
  task: Task
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: TaskStatus) => void
}) {
  const { profile } = useProfile()
  const assigneeName = task.assignee === CURRENT_ASSIGNEE ? profile.displayName : task.assignee
  const overdue = isTaskOverdue(task)
  return (
    <article className="task-card" draggable={Boolean(drag)}
      data-dragging={drag?.active || undefined} onDragStart={drag?.onStart} onDragEnd={drag?.onEnd}
      aria-describedby={drag ? 'board-move-help' : undefined}>
      {drag && <span className="task-card__drag-hint" aria-hidden="true"><Icon name="menu" />Drag to move</span>}
      <details>
        <summary><h3>{task.title}</h3></summary>
        <p className="task-card__description">{task.description || 'No description yet.'}</p>
      </details>
      <div className="task-card__meta">
        <span className={`task-priority task-priority--${task.priority}`}>{task.priority}</span>
        <span className={overdue ? 'task-card__date task-card__date--overdue' : 'task-card__date'}>
          <Icon name="calendar" /><time dateTime={task.dueDate}>{formatTaskDate(task.dueDate)}</time>
          {overdue && <span>Overdue</span>}
        </span>
      </div>
      <div className="task-card__assignee">
        <span aria-hidden="true">{assigneeName.slice(0, 1)}</span>
        Assigned to {assigneeName}
      </div>
      <label className="task-card__status">Status
        <select value={task.status} aria-label={`Status of ${task.title}`}
          onChange={event => onStatusChange(event.target.value as TaskStatus)}>
          {taskStatuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
      </label>
      <footer className="task-card__actions">
        <Button variant="secondary" onClick={onEdit} aria-label={`Edit ${task.title}`}>Edit</Button>
        <Button variant="secondary" className="task-card__delete" onClick={onDelete} aria-label={`Delete ${task.title}`}>Delete</Button>
      </footer>
    </article>
  )
}
