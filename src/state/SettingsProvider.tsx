import { useState, type ReactNode } from 'react'
import { defaultSettings, isSettings, loadSettings, serializeSettings, SETTINGS_STORAGE_KEY, type Settings } from '../data/settings'
import { SettingsContext } from './settingsContext'

function readInitialSettings() {
  if (typeof window === 'undefined') return { settings: defaultSettings, canSave: false, warning: '' }
  try {
    return loadSettings(window.localStorage)
  } catch {
    return { settings: defaultSettings, canSave: false, warning: 'Browser storage is unavailable. Settings changes will last only for this session.' }
  }
}
export default function SettingsProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readInitialSettings)
  const [settings, setSettings] = useState(initial.settings)
  const [storageWarning, setStorageWarning] = useState(initial.warning)
  function saveSettings(draft: Settings): boolean {
    if (!isSettings(draft)) return false
    let persisted = false
    if (initial.canSave) {
      try {
        window.localStorage.setItem(SETTINGS_STORAGE_KEY, serializeSettings(draft))
        persisted = true
        setStorageWarning('')
      } catch {
        setStorageWarning('Settings updated for this session, but browser storage could not save them. Changes may be lost after a reload.')
      }
    }
    setSettings({ ...draft })
    return persisted
  }
  return <SettingsContext.Provider value={{ settings, storageWarning, saveSettings }}>{children}</SettingsContext.Provider>
}
