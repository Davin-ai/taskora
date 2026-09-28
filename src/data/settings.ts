import type { TaskPriority } from './tasks'

export interface Settings {
  defaultPriority: TaskPriority
  weekStartsOn: 0 | 1 | 6
  showCompleted: boolean
  compactCards: boolean
}
export const defaultSettings: Settings = {
  defaultPriority: 'medium', weekStartsOn: 1, showCompleted: false, compactCards: false,
}
export const SETTINGS_STORAGE_KEY = 'taskora.settings.v1'

export function isSettings(value: unknown): value is Settings {
  if (!value || typeof value !== 'object') return false
  const settings = value as Settings
  return ['high', 'medium', 'low'].includes(settings.defaultPriority) &&
    [0, 1, 6].includes(settings.weekStartsOn) && typeof settings.showCompleted === 'boolean' &&
    typeof settings.compactCards === 'boolean'
}
export function serializeSettings(settings: Settings): string {
  return JSON.stringify({ version: 1, settings })
}
export function parseSettings(raw: string): Settings {
  const data = JSON.parse(raw)
  if (!data || data.version !== 1 || !isSettings(data.settings)) throw new Error('Invalid settings')
  return {
    defaultPriority: data.settings.defaultPriority, weekStartsOn: data.settings.weekStartsOn,
    showCompleted: data.settings.showCompleted, compactCards: data.settings.compactCards,
  }
}
export function loadSettings(storage: Pick<Storage, 'getItem'>) {
  try {
    const raw = storage.getItem(SETTINGS_STORAGE_KEY)
    return { settings: raw === null ? defaultSettings : parseSettings(raw), canSave: true, warning: '' }
  } catch {
    return { settings: defaultSettings, canSave: false, warning: 'Saved settings could not be read. Changes will last only for this session; existing saved data will not be replaced.' }
  }
}
export function calendarCompletionFilter(value: string | null, settings: Settings): boolean {
  return value === 'yes' ? true : value === 'no' ? false : settings.showCompleted
}
