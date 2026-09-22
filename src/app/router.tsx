import { createBrowserRouter } from 'react-router-dom'
import DashboardPage from '../pages/DashboardPage'
import LoginPage from '../pages/LoginPage'
import NotFoundPage from '../pages/NotFoundPage'
import ProjectsPage from '../pages/ProjectsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/projects',
    element: <ProjectsPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])