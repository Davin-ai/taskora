import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import Button from './ui/Button'
import Modal from './ui/Modal'
import { createTaskBackup, readTaskBackup, summarizeTaskBackup, MAX_BACKUP_BYTES } from '../data/taskBackup'
import { localDateKey } from '../data/calendar'
import type { Task } from '../data/tasks'
import { useTasks } from '../state/taskContext'
import './TaskBackup.css'

export default function TaskBackup() {
  const { tasks, dispatch, storageError } = useTasks()
  const [pending, setPending] = useState<{ name: string; tasks: Task[] } | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const readId = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  useEffect(() => () => { readId.current++ }, [])

  function exportBackup() {
    let url: string | undefined
    const anchor = document.createElement('a')
    setError('')
    try {
      const text = createTaskBackup(tasks)
      url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
      anchor.href = url
      anchor.download = `taskora-tasks-${localDateKey(new Date())}.json`
      document.body.append(anchor)
      anchor.click()
      setMessage(`Backup download requested for ${tasks.length} tasks.`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The backup could not be downloaded.')
    } finally {
      anchor.remove()
      if (url) {
        const downloadUrl = url
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      }
    }
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const requestId = ++readId.current
    setReading(true)
    setError('')
    setMessage('')
    setPending(null)
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('The backup is too large. The maximum size is 2 MB.')
      const text = await file.text()
      if (readId.current !== requestId) return
      setPending({ name: file.name, tasks: readTaskBackup(text) })
    } catch (cause) {
      if (readId.current === requestId) setError(cause instanceof Error ? cause.message : 'The file could not be read.')
    } finally {
      if (readId.current === requestId) setReading(false)
    }
  }

  function cancelImport() {
    setPending(null)
    setMessage('Import cancelled. Your tasks were not changed.')
    requestAnimationFrame(() => fileInput.current?.focus())
  }

  const summary = pending ? summarizeTaskBackup(pending.tasks) : null

  return (
    <section className="task-backup" aria-labelledby="backup-heading">
      <h2 id="backup-heading">Task backup</h2>
      <p>Download your tasks as a JSON file and restore them in this browser later. The backup includes task details and assignments; profile and settings are separate.</p>
      <div className="task-backup__controls">
        <Button variant="secondary" onClick={exportBackup}>Download task backup</Button>
        <label>Choose a backup to review
          <input ref={fileInput} type="file" accept=".json,application/json" disabled={reading}
            aria-describedby="backup-limit" onChange={chooseBackup} />
        </label>
      </div>
      <small id="backup-limit">Taskora JSON files, up to 2 MB. Selecting a file does not change your tasks.</small>
      {reading && <p role="status">Reading backup…</p>}
      {!pending && error && <p className="task-backup__error" role="alert">{error}</p>}
      {!pending && message && <p className="task-backup__message" role="status">{message}</p>}
      {pending && summary && <Modal title="Review task backup" onClose={cancelImport}>
        <p className="modal__description">File: <strong>{pending.name}</strong></p>
        <dl className="backup-summary">
          <div><dt>Tasks in file</dt><dd>{summary.total}</dd></div>
          <div><dt>Projects with tasks</dt><dd>{summary.projects}</dd></div>
          <div><dt>Completed</dt><dd>{summary.completed}</dd></div>
          <div><dt>Open</dt><dd>{summary.open}</dd></div>
        </dl>
        <p className="task-backup__warning">This replaces all {tasks.length} current tasks with {summary.total} tasks from the file, including their statuses and deadlines. This replacement cannot be undone with the task Undo button. Download a backup first if you want to keep the current version.</p>
        {summary.total === 0 && <p className="task-backup__warning">This backup is empty. Importing it removes all current tasks.</p>}
        {storageError && <p className="task-backup__warning">Browser storage has a reported problem. Imported tasks may only be available during this session.</p>}
        {error && <p className="task-backup__error" role="alert">{error}</p>}
        {message && <p className="task-backup__message" role="status">{message}</p>}
        <div className="modal__actions">
          <Button autoFocus variant="secondary" onClick={cancelImport}>Cancel</Button>
          <Button variant="secondary" onClick={exportBackup}>Back up current tasks</Button>
          <Button className="button--danger" onClick={() => {
            dispatch({ type: 'replace', tasks: pending.tasks })
            setPending(null)
            setMessage('Imported tasks are now in the workspace. Any storage problem is shown above.')
            requestAnimationFrame(() => fileInput.current?.focus())
          }}>Replace all tasks</Button>
        </div>
      </Modal>}
    </section>
  )
}
