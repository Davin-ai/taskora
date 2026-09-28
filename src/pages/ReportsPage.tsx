import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { buildReport, reportCsv } from '../data/reports'
import { localDateKey } from '../data/calendar'
import { formatTaskDate } from '../data/tasks'
import { useTasks } from '../state/taskContext'
import { useProfile } from '../state/profileContext'
import { CURRENT_ASSIGNEE } from '../data/myTasks'
import './ReportsPage.css'

export default function ReportsPage() {
  const { profile } = useProfile()
  const { tasks, projects } = useTasks()
  const [params, setParams] = useSearchParams()
  const [exportMessage, setExportMessage] = useState('')
  const rawProject = params.get('project')
  const projectId = projects.some(project => project.id === rawProject) ? rawProject! : 'all'
  const mineOnly = params.get('owner') === 'me'
  const report = buildReport(tasks, projects, projectId, mineOnly)

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
    setExportMessage('')
  }

  function exportCsv() {
    let url: string | undefined
    const anchor = document.createElement('a')
    try {
      url = URL.createObjectURL(new Blob([reportCsv(report.items.map(task => ({ ...task, assignee: task.assignee === CURRENT_ASSIGNEE ? profile.displayName : task.assignee })), projects)], { type: 'text/csv;charset=utf-8' }))
      anchor.href = url
      anchor.download = `taskora-report-${localDateKey(new Date())}.csv`
      document.body.append(anchor)
      anchor.click()
      setExportMessage(`CSV download requested for ${report.total} tasks.`)
    } catch {
      setExportMessage('The CSV could not be downloaded. Please try again.')
    } finally {
      anchor.remove()
      if (url) {
        const downloadUrl = url
        window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
      }
    }
  }

  return (
    <div className="reports-page">
      <header className="reports-heading">
        <div><span>SEE THE BIGGER PICTURE</span><h1>Reports</h1><p>A clear snapshot of your workspace, based on its current tasks.</p></div>
        <Button onClick={exportCsv} disabled={report.total === 0}>Export CSV</Button>
      </header>
      <section className="report-filters" aria-label="Report filters">
        <label>Project<select value={projectId} onChange={event => updateFilter('project', event.target.value)}>
          <option value="all">All projects</option>
          {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select></label>
        <label className="report-owner"><input type="checkbox" checked={mineOnly}
          onChange={event => updateFilter('owner', event.target.checked ? 'me' : '')} />Only my tasks</label>
        {(projectId !== 'all' || mineOnly) && <Button variant="secondary" onClick={() => { setParams({}); setExportMessage('') }}>Reset filters</Button>}
      </section>
      <p className="report-scope" role="status">{report.total} tasks in this report · {mineOnly ? 'Assigned to me' : 'All assignees'} · All deadlines</p>
      {exportMessage && <p className="report-export-message" role="status">{exportMessage}</p>}
      <section className="report-stats" aria-label="Report summary">
        {[
          { label: 'Total tasks', value: report.total },
          { label: 'Completed', value: report.completed },
          { label: 'Overdue', value: report.overdue.length },
          { label: 'Completion rate', value: `${report.completionRate}%` },
        ].map(stat => <article key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong></article>)}
      </section>
      {report.total === 0 && <div className="report-empty"><Icon name="folder" /><h2>No tasks to report</h2><p>Change the filters or add a task from a project to get started.</p><Link to="/projects">Open projects</Link></div>}
      <div className="report-charts">
        <section className="report-panel" aria-labelledby="status-report"><h2 id="status-report">Task status</h2>
          <ul className="report-bars">{report.statuses.map(status => <li key={status.value}>
            <div><span>{status.label}</span><strong>{status.count}</strong></div>
            <progress max={Math.max(1, report.total)} value={status.count} aria-label={`${status.label}: ${status.count} of ${report.total} tasks`} />
          </li>)}</ul>
        </section>
        <section className="report-panel" aria-labelledby="priority-report"><h2 id="priority-report">Task priority</h2>
          <ul className="report-bars">{report.priorities.map(item => <li key={item.priority}>
            <div><span className="report-priority">{item.priority}</span><strong>{item.count}</strong></div>
            <progress max={Math.max(1, report.total)} value={item.count} aria-label={`${item.priority} priority: ${item.count} of ${report.total} tasks`} />
          </li>)}</ul>
        </section>
      </div>
      <section className="report-panel" aria-labelledby="project-report">
        <h2 id="project-report">Project completion</h2>
        <p className="report-caption">Counts and percentages follow the filters above.</p>
        <div className="report-table-wrap" tabIndex={0} role="region" aria-label="Project completion table">
          <table><thead><tr><th scope="col">Project</th><th scope="col">Tasks</th><th scope="col">Done</th><th scope="col">Overdue</th><th scope="col">Completion</th></tr></thead>
            <tbody>{report.projects.map(project => <tr key={project.id}>
              <th scope="row"><Link to={`/projects/${project.id}`}>{project.name}</Link></th>
              <td>{project.total}</td><td>{project.completed}</td><td>{project.overdue}</td>
              <td>{project.total ? `${project.completionRate}%` : 'No tasks'}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
      <section className="report-panel report-overdue" aria-labelledby="overdue-report">
        <h2 id="overdue-report">Needs attention <span>{report.overdue.length}</span></h2>
        <p className="report-caption">Open tasks past their deadline, oldest first.</p>
        {report.overdue.length ? <ul>{report.overdue.map(task => <li key={task.id}>
          <div><Link to={`/projects/${task.projectId}?q=${encodeURIComponent(task.title)}`}>{task.title}</Link>
            <p>{projects.find(project => project.id === task.projectId)?.name} · {task.assignee === CURRENT_ASSIGNEE ? profile.displayName : task.assignee}</p></div>
          <time dateTime={task.dueDate}>{formatTaskDate(task.dueDate)}</time>
        </li>)}</ul> : <p className="report-clear">No overdue tasks in this report.</p>}
      </section>
    </div>
  )
}
