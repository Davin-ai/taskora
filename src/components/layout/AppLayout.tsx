import { useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import Icon, { type IconName } from '../ui/Icon'
import { useTasks } from '../../state/taskContext'
import { useProfile } from '../../state/profileContext'
import Avatar from '../Avatar'
import { useSettings } from '../../state/settingsContext'
import { useDemoSession } from '../../state/demoSessionContext'
import './AppLayout.css'

const navigation: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/projects', label: 'Projects', icon: 'folder' },
  { to: '/tasks', label: 'My Tasks', icon: 'check' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/reports', label: 'Reports', icon: 'spark' },
  { to: '/profile', label: 'Profile', icon: 'user' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export interface AppLayoutContext {
  search: string
  setSearch: (value: string) => void
}

function AppLayout() {
  const { closeDemo, warning: sessionWarning } = useDemoSession()
  const navigate = useNavigate()
  const { settings, storageWarning: settingsWarning } = useSettings()
  const { profile, storageWarning } = useProfile()
  const { storageError, message, deleted, dispatch } = useTasks()
  const { pathname } = useLocation()
  const showProjectSearch = pathname === '/' || pathname === '/projects'
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButton = useRef<HTMLButtonElement>(null)
  const mainContent = useRef<HTMLElement>(null)
  function followNavigation() {
    setMenuOpen(false)
    requestAnimationFrame(() => mainContent.current?.focus())
  }
  const [search, setSearch] = useState('')

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar" onKeyDown={event => {
        if (event.key === 'Escape' && menuOpen) {
          event.preventDefault()
          setMenuOpen(false)
          menuButton.current?.focus()
        }
      }}>
        <div className="sidebar__heading">
          <Link to="/" className="brand" onClick={followNavigation}>
            <span className="brand__mark"><Icon name="spark" /></span>
            Taskora
          </Link>
          <Button variant="secondary" className="menu-toggle" ref={menuButton} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen} aria-controls="main-navigation" onClick={() => setMenuOpen(!menuOpen)}>
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </Button>
        </div>
        <nav id="main-navigation" aria-label="Main navigation"
          className={`sidebar__nav ${menuOpen ? 'sidebar__nav--open' : ''}`}>
          <span className="sidebar__caption">WORKSPACE</span>
          {navigation.map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={followNavigation}>
              <Icon name={icon} />{label}
            </NavLink>
          ))}
          <Button variant="secondary" className="sidebar__exit" onClick={() => { closeDemo(); navigate('/login', { replace: true }) }}>Leave demo</Button>
        </nav>
        <Link to="/profile" className="sidebar__profile">
          <Avatar profile={profile} />
          <span><strong>{profile.displayName}</strong><small>{profile.role || 'Personal workspace'}</small></span>
          <Icon name="arrow" />
        </Link>
      </aside>
      <div className={`workspace${settings.compactCards ? ' workspace--compact' : ''}`}>
        <header className="topbar">
          {showProjectSearch ? <div className="search-box">
            <Icon name="search" />
            <input type="search" aria-label="Search projects" placeholder="Search projects..."
              value={search} onChange={(event) => setSearch(event.target.value)} />
            {search && <button type="button" className="search-clear" aria-label="Clear search" onClick={() => setSearch('')}><Icon name="close" /></button>}
          </div>
          : <Link className="topbar__projects-link" to="/projects">All projects</Link>}
          <div className="topbar__account">
            <span className="workspace-label">Your personal workspace</span>
            <Link to="/profile" aria-label={`Open ${profile.displayName}'s profile`}><Avatar profile={profile} /></Link>
          </div>
        </header>
        <main ref={mainContent} className="main-content" id="main-content" tabIndex={-1}>
          <div className="workspace-feedback">
            {sessionWarning && <p className="workspace-storage-error" role="alert">{sessionWarning}</p>}
            {settingsWarning && <p className="workspace-storage-error" role="alert">{settingsWarning}</p>}
            {storageWarning && <p className="workspace-storage-error" role="alert">{storageWarning}</p>}
            {storageError && <p className="workspace-storage-error" role="alert">{storageError}</p>}
            {(message || deleted) && <div className="workspace-notice">
              <span role="status">{message || 'Your last deleted task can still be restored.'}</span>
              {deleted && <Button variant="secondary" onClick={() => dispatch({ type: 'undo' })}>Undo last deletion</Button>}
              {message && <Button variant="secondary" aria-label="Dismiss message" onClick={() => dispatch({ type: 'dismiss' })}><Icon name="close" /></Button>}
            </div>}
          </div>
          <Outlet context={{ search, setSearch } satisfies AppLayoutContext} />
        </main>
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.filter(item => item.to !== '/settings' && item.to !== '/reports').map(({ to, label, icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={followNavigation}>
              <Icon name={icon} /><span>{label === 'Dashboard' ? 'Home' : label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default AppLayout
