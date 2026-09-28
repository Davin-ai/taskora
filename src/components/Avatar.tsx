import { avatarColors, profileInitials, type Profile } from '../data/profile'

export default function Avatar({ profile, large = false }: { profile: Profile; large?: boolean }) {
  return <span className={large ? 'avatar avatar--large' : 'avatar'} aria-hidden="true"
    style={{ backgroundColor: avatarColors[profile.avatarColor] }}>{profileInitials(profile.displayName)}</span>
}
