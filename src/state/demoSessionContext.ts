import { createContext, useContext } from 'react'

export interface DemoSessionValue {
  active: boolean
  warning: string
  openDemo: () => void
  closeDemo: () => void
}
export const DemoSessionContext = createContext<DemoSessionValue | null>(null)
export function useDemoSession(): DemoSessionValue {
  const value = useContext(DemoSessionContext)
  if (!value) throw new Error('useDemoSession requires DemoSessionProvider')
  return value
}
