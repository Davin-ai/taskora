import { useState, type FormEvent } from 'react'
import Avatar from '../components/Avatar'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { avatarColors, cleanProfile, validateProfile, type Profile, type ProfileErrors } from '../data/profile'
import { getMyTasks } from '../data/myTasks'
import { useProfile } from '../state/profileContext'
import { useTasks } from '../state/taskContext'
import './ProfilePage.css'

export default function ProfilePage() {
  const { profile, saveProfile } = useProfile()
  const { tasks } = useTasks()
  const [draft, setDraft] = useState(profile)
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [message, setMessage] = useState('')
  const mine = getMyTasks(tasks)
  const changed = JSON.stringify(draft) !== JSON.stringify(profile)

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft(current => ({ ...current, [key]: value }))
    setErrors(current => ({ ...current, [key]: undefined }))
    setMessage('')
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateProfile(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    const next = cleanProfile(draft)
    const persisted = saveProfile(next)
    setDraft(next)
    setMessage(persisted ? 'Profile saved.' : 'Profile updated for this session.')
  }

  return (
    <div className="profile-page">
      <header><span>MAKE IT YOURS</span><h1>Profile</h1><p>Your display details, available across this workspace.</p></header>
      <div className="profile-grid">
        <aside className="profile-preview" aria-label="Profile preview">
          <Avatar profile={draft} large />
          <h2>{draft.displayName.trim() || 'Your name'}</h2>
          <p>{draft.role.trim() || 'Your workspace'}</p>
          {draft.bio.trim() && <p className="profile-preview__bio">{draft.bio}</p>}
          <dl><div><dt>My tasks</dt><dd>{mine.length}</dd></div><div><dt>Completed</dt><dd>{mine.filter(task => task.status === 'done').length}</dd></div></dl>
          <small>Preview · Save to apply your changes.</small>
        </aside>
        <form className="profile-form" noValidate onSubmit={submit}>
          <h2>Personal details</h2>
          <p className="profile-note">These details are stored in this browser. Email is optional and does not change a sign-in account.</p>
          {Object.values(errors).some(Boolean) && <p role="alert" className="field__error">Please correct the fields below.</p>}
          <Input label="Display name" autoComplete="name" required maxLength={60} value={draft.displayName}
            error={errors.displayName} onChange={event => update('displayName', event.target.value)} />
          <Input label="Email (optional)" type="email" autoComplete="email" maxLength={254} value={draft.email}
            error={errors.email} onChange={event => update('email', event.target.value)} />
          <Input label="Role or headline" maxLength={80} value={draft.role}
            error={errors.role} onChange={event => update('role', event.target.value)} />
          <label className="field">About you
            <textarea maxLength={500} rows={4} value={draft.bio} onChange={event => update('bio', event.target.value)} />
            <span className="profile-count">{draft.bio.length}/500</span>
          </label>
          <fieldset className="profile-colors"><legend>Avatar color</legend>
            {Object.entries(avatarColors).map(([name, color]) =>
              <button type="button" key={name} style={{ backgroundColor: color }}
                aria-label={`${name} avatar`} aria-pressed={draft.avatarColor === name}
                onClick={() => update('avatarColor', name as Profile['avatarColor'])}>{draft.avatarColor === name ? '✓' : ''}</button>)}
          </fieldset>
          {message && <p className="profile-message" role="status">{message}</p>}
          <footer>
            <Button variant="secondary" disabled={!changed} onClick={() => { setDraft(profile); setErrors({}); setMessage('Changes discarded.') }}>Cancel changes</Button>
            <Button type="submit" disabled={!changed}>Save profile</Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
