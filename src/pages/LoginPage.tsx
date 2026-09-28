import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Avatar from '../components/Avatar'
import { useProfile } from '../state/profileContext'
import { useDemoSession } from '../state/demoSessionContext'
import { safeReturnTo } from '../data/demoSession'
import './EntryPages.css'

export default function LoginPage() {
  const { profile } = useProfile()
  const { active, warning, openDemo } = useDemoSession()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const destination = safeReturnTo(params.get('next'))

  function enterWorkspace() {
    openDemo()
    navigate(destination, { replace: true })
  }

  return (
    <main className="entry-page">
      <section className="entry-story" aria-label="About Taskora">
        <div className="entry-brand"><span><Icon name="spark" /></span>Taskora</div>
        <div><span className="entry-eyebrow">LESS NOISE. MORE PROGRESS.</span><h1>A little focus.<br />A lot of possibility.</h1>
          <p>Bring your projects, tasks and deadlines together in one calm workspace.</p></div>
        <ul><li><Icon name="folder" />See every project clearly</li><li><Icon name="check" />Move work forward, one task at a time</li><li><Icon name="calendar" />Make space for your next deadline</li></ul>
      </section>
      <section className="entry-card" aria-labelledby="welcome-heading">
        <span className="entry-badge">LOCAL DEMO</span>
        <h2 id="welcome-heading">Welcome to Taskora</h2>
        <p>Your workspace is ready when you are.</p>
        <div className="entry-person"><Avatar profile={profile} /><div><strong>{profile.displayName}</strong><span>{profile.role || 'Personal workspace'}</span></div></div>
        <Button onClick={enterWorkspace}>{active ? 'Continue to workspace' : 'Open demo workspace'} <Icon name="arrow" /></Button>
        {warning && <p className="entry-warning" role="alert">{warning}</p>}
        <p className="entry-note">No account or password is required. This demo does not provide authentication. Tasks, profile and settings are stored in this browser.</p>
        <p className="entry-note">Leaving the demo keeps your saved work. The demo session is remembered in this tab.</p>
        {active && <Link to="/">Go to dashboard</Link>}
      </section>
    </main>
  )
}
