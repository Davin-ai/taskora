import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'
import TaskBackup from '../components/TaskBackup'
import { defaultSettings, type Settings } from '../data/settings'
import { useSettings } from '../state/settingsContext'
import './SettingsPage.css'

export default function SettingsPage() {
  const { settings, saveSettings } = useSettings()
  const [draft, setDraft] = useState(settings)
  const [message, setMessage] = useState('')
  const changed = JSON.stringify(settings) !== JSON.stringify(draft)

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft(current => ({ ...current, [key]: value }))
    setMessage('')
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const persisted = saveSettings(draft)
    setMessage(persisted ? 'Settings saved.' : 'Settings applied for this session.')
  }

  return (
    <div className="settings-page">
      <header><span>YOUR WORKSPACE, YOUR WAY</span><h1>Settings</h1><p>Choose how tasks and your calendar work for you.</p></header>
      <form onSubmit={submit}>
        <section aria-labelledby="task-settings">
          <h2 id="task-settings">Task defaults</h2>
          <div className="settings-row">
            <label htmlFor="default-priority">New task priority<small>Used when creating a task. Existing tasks keep their priority.</small></label>
            <select id="default-priority" value={draft.defaultPriority} onChange={event => update('defaultPriority', event.target.value as Settings['defaultPriority'])}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </select>
          </div>
        </section>
        <section aria-labelledby="calendar-settings">
          <h2 id="calendar-settings">Calendar</h2>
          <div className="settings-row">
            <label htmlFor="week-start">Start week on<small>Changes the order of days in the monthly calendar.</small></label>
            <select id="week-start" value={draft.weekStartsOn} onChange={event => update('weekStartsOn', Number(event.target.value) as Settings['weekStartsOn'])}>
              <option value={1}>Monday</option><option value={0}>Sunday</option><option value={6}>Saturday</option>
            </select>
          </div>
          <div className="settings-row">
            <label htmlFor="completed-default">Show completed tasks by default<small>You can still change this for an individual calendar view.</small></label>
            <input id="completed-default" type="checkbox" checked={draft.showCompleted} onChange={event => update('showCompleted', event.target.checked)} />
          </div>
          <Link to="/calendar">Open calendar →</Link>
        </section>
        <section aria-labelledby="display-settings">
          <h2 id="display-settings">Display</h2>
          <div className="settings-row">
            <label htmlFor="compact-cards">Compact task cards<small>Use less spacing in project boards, My Tasks and the calendar.</small></label>
            <input id="compact-cards" type="checkbox" checked={draft.compactCards} onChange={event => update('compactCards', event.target.checked)} />
          </div>
          <div className={`settings-preview${draft.compactCards ? ' settings-preview--compact' : ''}`} aria-label="Task density preview">
            <strong>Plan the next milestone</strong><span>Medium priority · Assigned to you</span>
          </div>
        </section>
        <p className="settings-note">Settings apply to this browser. Your tasks and profile are kept when preferences change.</p>
        {message && <p role="status" className="settings-message">{message}</p>}
        <footer>
          <Button variant="secondary" onClick={() => { setDraft({ ...defaultSettings }); setMessage('Default values loaded. Save settings to apply them.') }}>Restore defaults</Button>
          <div>
            <Button variant="secondary" disabled={!changed} onClick={() => { setDraft(settings); setMessage('Changes discarded.') }}>Cancel changes</Button>
            <Button type="submit" disabled={!changed}>Save settings</Button>
          </div>
        </footer>
      </form>
      <TaskBackup />
    </div>
  )
}
