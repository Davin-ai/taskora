export const avatarColors = { purple: '#7563ee', blue: '#326ad4', green: '#087c67', rose: '#b83262', slate: '#475569' } as const
export interface Profile {
  displayName: string
  email: string
  role: string
  bio: string
  avatarColor: keyof typeof avatarColors
}
export const defaultProfile: Profile = { displayName: 'Kosar', email: '', role: 'Personal workspace', bio: '', avatarColor: 'purple' }
export const PROFILE_STORAGE_KEY = 'taskora.profile.v1'
export type ProfileErrors = Partial<Record<keyof Profile, string>>

export function validateProfile(profile: Profile): ProfileErrors {
  const errors: ProfileErrors = {}
  if (!profile.displayName.trim()) errors.displayName = 'Enter your display name.'
  else if (profile.displayName.trim().length > 60) errors.displayName = 'Use 60 characters or fewer.'
  if (profile.email.trim() && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) || profile.email.trim().length > 254)) errors.email = 'Enter a valid email address.'
  if (profile.role.trim().length > 80) errors.role = 'Use 80 characters or fewer.'
  if (profile.bio.trim().length > 500) errors.bio = 'Use 500 characters or fewer.'
  if (!Object.hasOwn(avatarColors, profile.avatarColor)) errors.avatarColor = 'Choose an avatar color.'
  return errors
}
export function cleanProfile(profile: Profile): Profile {
  return { displayName: profile.displayName.trim(), email: profile.email.trim(), role: profile.role.trim(), bio: profile.bio.trim(), avatarColor: profile.avatarColor }
}
export function profileInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0] ?? '').join('').toUpperCase() || 'K'
}
export function serializeProfile(profile: Profile): string {
  return JSON.stringify({ version: 1, profile: cleanProfile(profile) })
}
export function parseProfile(raw: string): Profile {
  const value = JSON.parse(raw)
  if (!value || value.version !== 1 || !value.profile ||
    !['displayName', 'email', 'role', 'bio', 'avatarColor'].every(key => typeof value.profile[key] === 'string') ||
    Object.keys(validateProfile(value.profile)).length) throw new Error('Invalid profile')
  return cleanProfile(value.profile)
}
