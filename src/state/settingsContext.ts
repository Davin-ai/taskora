import { createContext, useContext } from 'react'
import type { Settings } from '../data/settings'

export interface SettingsContextValue {
  settings: Settings
  storageWarning: string
  saveSettings: (settings: Settings) => boolean
}
export const SettingsContext = createContext<SettingsContextValue | null>(null)
export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext)
  if (!value) throw new Error('useSettings requires SettingsProvider')
  return value
}
