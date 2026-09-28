import { getTaskProgress, type Task } from './tasks'
import type { IconName } from '../components/ui/Icon'

export type ProjectStatus = 'active' | 'completed'
export interface Project {
  id: string
  name: string
  description: string
  tasks: number
  progress: number
  icon: IconName
  color: 'purple' | 'blue' | 'cyan' | 'orange'
}

export const projectDefinitions: Omit<Project, 'tasks' | 'progress'>[] = [
  { id: 'e-commerce', name: 'E-Commerce Website', description: 'Build a modern online store', icon: 'bag', color: 'purple' },
  { id: 'mobile-app', name: 'Mobile App Design', description: 'UI/UX for the mobile app', icon: 'phone', color: 'blue' },
  { id: 'company-website', name: 'Company Website', description: 'Redesign the official website', icon: 'globe', color: 'cyan' },
  { id: 'marketing', name: 'Marketing Campaign', description: 'Q4 marketing assets', icon: 'megaphone', color: 'orange' },
]

export function buildProjects(tasks: Task[]): Project[] {
  return projectDefinitions.map(project => {
    const items = tasks.filter(task => task.projectId === project.id)
    return { ...project, tasks: items.length, progress: getTaskProgress(items) }
  })
}

export function getProjectStatus(project: Project): ProjectStatus {
  return project.progress === 100 ? 'completed' : 'active'
}

export function matchesProjectSearch(project: Project, search: string): boolean {
  return `${project.name} ${project.description}`.toLowerCase().includes(search.trim().toLowerCase())
}

export type ProjectFilter = 'all' | ProjectStatus
export type ProjectSort = 'default' | 'name' | 'progress'

export function selectProjects(items: Project[], search: string, filter: ProjectFilter, sort: ProjectSort): Project[] {
  const result = items.filter(project =>
    matchesProjectSearch(project, search) && (filter === 'all' || getProjectStatus(project) === filter))
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'progress') result.sort((a, b) => b.progress - a.progress)
  return result
}
