import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../components/layout/AppLayout'
import DemoGate from '../components/DemoGate'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProfilePage from '../pages/ProfilePage'
import ProjectsPage from '../pages/ProjectsPage'
import ProjectDetailsPage from '../pages/ProjectDetailsPage'
import SettingsPage from '../pages/SettingsPage'
import MyTasksPage from '../pages/MyTasksPage'
import CalendarPage from '../pages/CalendarPage'
import ReportsPage from '../pages/ReportsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DemoGate><AppLayout /></DemoGate>,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectDetailsPage />,
      },
      {
        path: 'tasks',
        element: <MyTasksPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
