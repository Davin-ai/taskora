export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type TaskPriority = 'high' | 'medium' | 'low'

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  assignee: string
  dueDate: string
}

export const taskStatuses: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: '#9aa9c2' },
  { value: 'in-progress', label: 'In Progress', color: '#665bff' },
  { value: 'done', label: 'Done', color: '#21c5a3' },
]

const seedProjects = [
  { id: 'e-commerce', completed: 9, titles: ['Set up project', 'Design homepage', 'Create product listing', 'Build product details', 'Build shopping cart', 'Create API endpoints', 'Integrate payment', 'Responsive design', 'Database schema', 'Design Login Page', 'Test checkout flow', 'Prepare launch'] },
  { id: 'mobile-app', completed: 3, titles: ['User research', 'Create wireframes', 'Design system', 'API Integration', 'Design onboarding', 'Build navigation', 'Prototype interactions', 'Usability testing'] },
  { id: 'company-website', completed: 1, titles: ['Content audit', 'Design landing page', 'Build about page', 'Create contact form', 'Improve accessibility', 'Review performance'] },
  { id: 'marketing', completed: 6, titles: ['Define audience', 'Campaign brief', 'Write campaign copy', 'Design social assets', 'Create email templates', 'Review brand guidelines', 'Prepare Presentation', 'Schedule campaign', 'Set up analytics', 'Review campaign results'] },
]

function demoDate(offset: number): string {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Initial demo deadlines are relative to the first visit; persisted tasks retain their dates.
export const tasks: Task[] = seedProjects.flatMap(project =>
  project.titles.map((title, index) => ({
    id: `${project.id}-task-${index + 1}`,
    projectId: project.id,
    title,
    description: `Complete “${title}”, review the result against the project requirements, and share it with the team.`,
    status: index < project.completed ? 'done' : index === project.completed ? 'in-progress' : 'todo',
    priority: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low',
    assignee: index % 2 === 0 ? 'Kosar' : 'Alex',
    dueDate: demoDate(index < project.completed ? -2 : index - project.completed - 1),
  })),
)

export function getProjectTasks(projectId: string, items: Task[]): Task[] {
  return items.filter(task => task.projectId === projectId)
}

export function getTaskProgress(items: Task[]): number {
  return items.length === 0 ? 0 : Math.round(items.filter(task => task.status === 'done').length / items.length * 100)
}

export function selectTasks(items: Task[], search: string, priority: 'all' | TaskPriority): Task[] {
  const query = search.trim().toLowerCase()
  return items.filter(task =>
    (priority === 'all' || task.priority === priority) &&
    `${task.title} ${task.description} ${task.assignee}`.toLowerCase().includes(query))
}

export function isTaskOverdue(task: Task, today = new Date()): boolean {
  const deadline = new Date(`${task.dueDate}T00:00:00`)
  const day = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return task.status !== 'done' && deadline < day
}

export function formatTaskDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))
}
