export const DEMO_SESSION_KEY = 'taskora.demo-session.v1'

// This is a local demo entry flag, not authentication or access control.
export function readDemoSession(storage: Pick<Storage, 'getItem'>) {
  try {
    return { active: storage.getItem(DEMO_SESSION_KEY) === 'active', warning: '' }
  } catch {
    return { active: false, warning: 'Session storage is unavailable. You can use the demo, but a reload may return you to this page.' }
  }
}
export function writeDemoSession(storage: Pick<Storage, 'setItem' | 'removeItem'>, active: boolean): string {
  try {
    if (active) storage.setItem(DEMO_SESSION_KEY, 'active')
    else storage.removeItem(DEMO_SESSION_KEY)
    return ''
  } catch {
    return active
      ? 'The demo session could not be saved. A reload may return you to the welcome page.'
      : 'The demo was closed here, but the saved session flag could not be cleared.'
  }
}

export function safeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || Array.from(value).some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 92)) return '/'
  try {
    const url = new URL(value, 'https://taskora.invalid')
    const routes = ['/', '/projects', '/tasks', '/calendar', '/reports', '/profile', '/settings']
    if (url.origin !== 'https://taskora.invalid' ||
      (!routes.includes(url.pathname) && !/^\/projects\/[a-z0-9-]+$/.test(url.pathname))) return '/'
    return url.pathname + url.search + url.hash
  } catch {
    return '/'
  }
}
