import { useState, type ReactNode } from 'react'
import { readDemoSession, writeDemoSession } from '../data/demoSession'
import { DemoSessionContext } from './demoSessionContext'

function loadSession() {
  if (typeof window === 'undefined') return { active: false, warning: '' }
  try { return readDemoSession(window.sessionStorage) }
  catch { return { active: false, warning: 'Session storage is unavailable. The demo can still be used in this page.' } }
}
export default function DemoSessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadSession)
  function changeSession(active: boolean) {
    let warning: string
    try { warning = writeDemoSession(window.sessionStorage, active) }
    catch { warning = 'Session storage is unavailable. This change applies only to the current page.' }
    setSession({ active, warning })
  }
  return <DemoSessionContext.Provider value={{ ...session, openDemo: () => changeSession(true), closeDemo: () => changeSession(false) }}>{children}</DemoSessionContext.Provider>
}
