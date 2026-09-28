import { createContext, useContext } from 'react'
import type { Profile } from '../data/profile'

export interface ProfileContextValue {
  profile: Profile
  storageWarning: string
  saveProfile: (profile: Profile) => boolean
}
export const ProfileContext = createContext<ProfileContextValue | null>(null)
export function useProfile(): ProfileContextValue {
  const value = useContext(ProfileContext)
  if (!value) throw new Error('useProfile requires ProfileProvider')
  return value
}
