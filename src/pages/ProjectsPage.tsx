import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AppLayoutContext } from '../components/layout/AppLayout'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import { getProjectStatus, selectProjects, type ProjectFilter, type ProjectSort } from '../data/projects'
import { useTasks } from '../state/taskContext'
import './ProjectsPage.css'

const filters: { value: ProjectFilter; label: string }[] = [
  { value: 'all', label: 'All projects' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

function ProjectsPage() {
  const { projects } = useTasks()
  const { search, setSearch } = useOutletContext<AppLayoutContext>()
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const [sort, setSort] = useState<ProjectSort>('default')
  const visibleProjects = selectProjects(projects, search, filter, sort)
  const activeCount = projects.filter(project => getProjectStatus(project) === 'active').length
  const counts = { all: projects.length, active: activeCount, completed: projects.length - activeCount }

  function resetFilters() {
    setSearch('')
    setFilter('all')
    setSort('default')
  }

  return (
    <div className="projects-page">
      <header className="projects-heading">
        <span className="projects-eyebrow">YOUR WORK, IN ONE PLACE</span>
        <h1>Projects</h1>
        <p>Big ideas. Small steps. Keep every project moving forward.</p>
        <small>Your workspace · Projects and live task progress</small>
      </header>

      <section className="projects-toolbar" aria-label="Project controls">
        <div className="projects-filters" role="group" aria-label="Filter by project status">
          {filters.map(item => (
            <Button key={item.value} variant="secondary" aria-pressed={filter === item.value}
              onClick={() => setFilter(item.value)}>
              {item.label}<span>{counts[item.value]}</span>
            </Button>
          ))}
        </div>
        <label className="projects-sort">
          Sort by
          <select value={sort} onChange={event => setSort(event.target.value as ProjectSort)}>
            <option value="default">Default order</option>
            <option value="name">Name A–Z</option>
            <option value="progress">Highest progress</option>
          </select>
        </label>
      </section>

      <p className="projects-result-count" role="status">
        Showing {visibleProjects.length} of {projects.length} projects
        {search.trim() && <> matching “{search.trim()}”</>}
      </p>

      {visibleProjects.length > 0 ? (
        <section className="projects-grid" aria-label="Project list">
          {visibleProjects.map(project => {
            const status = getProjectStatus(project)
            return (
              <article className="project-card" id={project.id} key={project.id} tabIndex={-1}
                aria-labelledby={`${project.id}-title`}>
                <div className="project-card__top">
                  <span className={`icon-tile tone-${project.color}`}><Icon name={project.icon} /></span>
                  <span className={`project-status project-status--${status}`}>
                    {status === 'active' ? 'In progress' : 'Completed'}
                  </span>
                </div>
                <h2 id={`${project.id}-title`}><Link to={`/projects/${project.id}`}>{project.name}</Link></h2>
                <p>{project.description}</p>
                <div className="project-card__progress-label"><span>Progress</span><strong>{project.progress}%</strong></div>
                <progress max={100} value={project.progress} aria-label={`${project.name} progress`} />
                <footer>
                  <span><Icon name="check" />{project.tasks} tasks</span>
                  <Link to={`/projects/${project.id}`} aria-label={`Open ${project.name} board`}>Open board →</Link>
                </footer>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="projects-empty" aria-labelledby="empty-projects-title">
          <Icon name="search" />
          <h2 id="empty-projects-title">No projects found</h2>
          <p>{filter === 'completed' && !search.trim()
            ? 'No completed projects yet. Your active projects are still moving forward.'
            : 'Try a different search or reset your filters to see all projects.'}</p>
          <Button onClick={resetFilters}>Show all projects</Button>
        </section>
      )}
    </div>
  )
}

export default ProjectsPage
