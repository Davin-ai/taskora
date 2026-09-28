import { useState, type ReactNode } from 'react'
import { cleanProfile, defaultProfile, parseProfile, PROFILE_STORAGE_KEY, serializeProfile, validateProfile, type Profile } from '../data/profile'
import { ProfileContext } from './profileContext'

function loadProfile() {
  if (typeof window === 'undefined') return { profile: defaultProfile, canSave: false, warning: '' }
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    return { profile: raw === null ? defaultProfile : parseProfile(raw), canSave: true, warning: '' }
  } catch {
    return { profile: defaultProfile, canSave: false, warning: 'Saved profile could not be read. Profile changes will last only for this session; existing saved data will not be replaced.' }
  }
}

export default function ProfileProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(loadProfile)
  const [profile, setProfile] = useState(initial.profile)
  const [storageWarning, setStorageWarning] = useState(initial.warning)
  function saveProfile(draft: Profile): boolean {
    if (Object.keys(validateProfile(draft)).length) return false
    const next = cleanProfile(draft)
    let saved = false
    if (initial.canSave) {
      try {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, serializeProfile(next))
        saved = true
        setStorageWarning('')
      } catch {
        setStorageWarning('Profile updated for this session, but browser storage could not save it. Changes may be lost after a reload.')
      }
    }
    setProfile(next)
    return saved
  }
  return <ProfileContext.Provider value={{ profile, saveProfile, storageWarning }}>{children}</ProfileContext.Provider>
}
