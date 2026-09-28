import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useDemoSession } from '../state/demoSessionContext'
import { safeReturnTo } from '../data/demoSession'

export default function DemoGate({ children }: { children: ReactNode }) {
  const { active } = useDemoSession()
  const location = useLocation()
  if (!active) {
    const destination = safeReturnTo(location.pathname + location.search + location.hash)
    return <Navigate to={`/login?next=${encodeURIComponent(destination)}`} replace />
  }
  return children
}
