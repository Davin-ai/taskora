import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { useDemoSession } from '../state/demoSessionContext'
import './EntryPages.css'

export default function NotFoundPage() {
  const { active } = useDemoSession()
  return (
    <main className="not-found-page">
      <div className="entry-brand"><span><Icon name="spark" /></span>Taskora</div>
      <span className="not-found-code" aria-hidden="true">404</span>
      <h1>Page not found</h1>
      <p>This page may have moved, or the address may be incorrect.</p>
      <Link className="entry-link" to={active ? '/' : '/login'}>{active ? 'Back to dashboard' : 'Open Taskora'}</Link>
      {active && <Link to="/projects">Browse projects</Link>}
    </main>
  )
}
