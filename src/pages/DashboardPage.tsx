import { Link, useOutletContext } from 'react-router-dom'
import type { AppLayoutContext } from '../components/layout/AppLayout'
import Icon, { type IconName } from '../components/ui/Icon'
import { matchesProjectSearch, getProjectStatus } from '../data/projects'
import { taskStatuses, isTaskOverdue, formatTaskDate } from '../data/tasks'
import { getMyTasks } from '../data/myTasks'
import { useTasks } from '../state/taskContext'
import { useProfile } from '../state/profileContext'
import './DashboardPage.css'

function DashboardPage() {
  const { profile } = useProfile()
  const { tasks, projects } = useTasks()
  const myTasks = getMyTasks(tasks)
  const statuses = taskStatuses.map(status => ({
    name: status.label,
    color: status.color,
    count: myTasks.filter(task => task.status === status.value).length,
  }))
  const totalTasks = statuses.reduce((sum, status) => sum + status.count, 0)
  const completedTasks = statuses.find(status => status.name === "Done")?.count ?? 0;
  const toDoTasks = statuses.find(status => status.name === "To Do")?.count ?? 0;
  const inProgressTasks = statuses.find(status => status.name === "In Progress")?.count ?? 0;
  const overdueTasks = myTasks.filter(task => isTaskOverdue(task)).length
  // Each segment starts where the previous segment ends.
  const taskSegments = statuses.map((status, index) => {
    const precedingTasks = statuses.slice(0, index).reduce((sum, item) => sum + item.count, 0)
    const startAngle = totalTasks > 0 ? precedingTasks / totalTasks * 360 : 0
    const endAngle = totalTasks > 0 ? (precedingTasks + status.count) / totalTasks * 360 : 0
    return `${status.color} ${startAngle}deg ${endAngle}deg`
  })
  const taskChartBackground = totalTasks > 0
    ? `conic-gradient(${taskSegments.join(', ')})`
    : '#e3e9f4'
  const stats: { title: string; value: number; icon: IconName; color: string; detail: string }[] = [
    { title: 'Active Projects', value: projects.filter(project => getProjectStatus(project) === 'active').length, icon: 'folder', color: 'purple', detail: 'Ideas taking shape' },
    { title: 'My Tasks', value: totalTasks, icon: 'check', color: 'green', detail: 'Across your projects' },
    { title: 'Completed', value: completedTasks, icon: 'check', color: 'blue', detail: 'Keep up the good work' },
    { title: 'Overdue', value: overdueTasks, icon: 'clock', color: 'pink', detail: 'Need your attention' },
  ]
  const deadlines = myTasks
    .filter(task => task.status !== 'done' && !isTaskOverdue(task))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3)
    .flatMap(task => {
      const project = projects.find(item => item.id === task.projectId)
      return project ? [{ ...task, project: project.name, icon: project.icon, color: project.color }] : []
    })
  const { search } = useOutletContext<AppLayoutContext>()
  const filteredProjects = projects.filter(project => matchesProjectSearch(project, search))
  const today = new Date()
  const dateLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).format(today)

  return (
    <div className="dashboard">
      <section className="dashboard__welcome" aria-labelledby="dashboard-title">
        <div>
          <span className="eyebrow">A LITTLE FOCUS. A LOT OF PROGRESS.</span>
          <h1 id="dashboard-title">Hello, {profile.displayName} <span className="wave" aria-hidden="true">👋</span></h1>
          <p>Here's what's happening with your projects today.</p>
        </div>
        <div className="dashboard__date"><span>{dateLabel}</span><small>“Small steps make big progress.”</small></div>
      </section>

      <div className="demo-note"><span className="demo-dot" />Your workspace · Live project and task overview</div>
      <section className="stats-grid" aria-label="Workspace statistics">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.title}>
            <div className="stat-card__main">
              <span className={`icon-tile icon-tile--round tone-${stat.color}`}><Icon name={stat.icon} /></span>
              <div><strong className="stat-card__value">{stat.value}</strong><h2>{stat.title}</h2></div>
            </div>
            <p>{stat.detail}</p>
          </article>
        ))}
      </section>

      <div className="dashboard-grid">
        <section className="panel projects-panel" aria-labelledby="recent-projects">
          <div className="panel__heading"><h2 id="recent-projects">Recent Projects</h2><Link to="/projects">View all <Icon name="arrow" /></Link></div>
          <div className="project-list">
            {filteredProjects.map((project) => (
              <Link to={`/projects/${project.id}`} className="project-row" key={project.id}>
                <span className={`icon-tile tone-${project.color}`}><Icon name={project.icon} /></span>
                <div className="project-row__name"><h3>{project.name}</h3><p>{project.description}</p></div>
                <span className="project-row__tasks">{project.tasks} tasks</span>
                <div className="project-row__progress">
                  <progress max="100" value={project.progress} aria-label={`${project.name} progress`} />
                  <span>{project.progress}%</span>
                </div>
              </Link>
            ))}
            {filteredProjects.length === 0 && <p className="empty-state" role="status">No projects match “{search}”. Try another search.</p>}
          </div>
          <div className="panel__footer"><span className="demo-dot" />Every small step brings you closer.</div>
        </section>

        <div className="dashboard-column">
          <section className="panel" aria-labelledby="tasks-overview">
            <div className="panel__heading"><h2 id="tasks-overview">My Tasks Overview</h2><Link to="/tasks">View my tasks <Icon name="arrow" /></Link></div>
            <div className="task-overview">
              <div className="donut" role="img" style={{ background: taskChartBackground }} aria-label={`${totalTasks} assigned tasks: ${toDoTasks} to do, ${inProgressTasks} in progress, ${completedTasks} done`}>
                <div><strong>{totalTasks}</strong><span>Tasks</span></div>
              </div>
              <ul className="task-legend">
                {statuses.map((status) => <li key={status.name}><span className="legend-dot" style={{ backgroundColor: status.color }} /><span>{status.name}</span><strong>{status.count}</strong></li>)}
              </ul>
            </div>
            <p className="overview-note"><span className="legend-dot overdue-dot" />{overdueTasks} open tasks are overdue</p>
          </section>
          <section className="panel deadlines-panel" aria-labelledby="deadlines">
            <div className="panel__heading"><h2 id="deadlines">Upcoming Deadlines</h2><Link to="/calendar">Calendar <Icon name="calendar" /></Link></div>
            {deadlines.length === 0 && <p className="empty-state">No upcoming deadlines.</p>}
            <ul className="deadline-list">
              {deadlines.map((deadline) => (
                <li key={deadline.id}>
                  <span className={`icon-tile icon-tile--small tone-${deadline.color}`}><Icon name={deadline.icon} /></span>
                  <div><h3>{deadline.title}</h3><p>{deadline.project}</p></div>
                  <span>{formatTaskDate(deadline.dueDate)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <p className="dashboard__footnote">A clear view of today. More room for what comes next.</p>
    </div>
  )
}

export default DashboardPage
