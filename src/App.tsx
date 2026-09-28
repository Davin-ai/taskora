import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import TaskProvider from './state/TaskProvider'
import ProfileProvider from './state/ProfileProvider'
import SettingsProvider from './state/SettingsProvider'
import DemoSessionProvider from './state/DemoSessionProvider'

function App() {
  return (
    <DemoSessionProvider>
      <SettingsProvider>
        <ProfileProvider>
          <TaskProvider>
            <RouterProvider router={router} />
          </TaskProvider>
        </ProfileProvider>
      </SettingsProvider>
    </DemoSessionProvider>
  )
}

export default App
