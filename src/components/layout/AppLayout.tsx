import { NavLink, Outlet } from 'react-router-dom'
import './AppLayout.css'

function AppLayout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h1 className="sidebar__logo">Taskora</h1>

        <nav className="sidebar__nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>

          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/profile">Profile</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout