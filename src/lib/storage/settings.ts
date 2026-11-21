import { useSyncExternalStore } from 'react'
import { DEFAULT_MODEL } from '../../configs/app'

export interface Settings {
  apiKey: string
  model: string
  /** false = keep the key in memory only, until the tab is closed. */
  rememberKey: boolean
  /** false = don't save finished evaluations (for shared computers). */
  saveSessions: boolean
}

const PREFS_KEY = 'iwc.prefs'
const API_KEY_KEY = 'iwc.geminiKey'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    /* storage blocked: settings still work for this visit */
  }
}

function load(): Settings {
  let prefs: Partial<Settings> = {}
  try {
    prefs = JSON.parse(read(PREFS_KEY) ?? '{}') as Partial<Settings>
  } catch {
    prefs = {}
  }
  return {
    apiKey: read(API_KEY_KEY) ?? '',
    model: typeof prefs.model === 'string' && prefs.model ? prefs.model : DEFAULT_MODEL,
    rememberKey: prefs.rememberKey !== false,
    saveSessions: prefs.saveSessions !== false,
  }
}

let state: Settings = load()
const listeners = new Set<() => void>()

export function getSettings(): Settings {
  return state
}

export function updateSettings(patch: Partial<Settings>): void {
  state = { ...state, ...patch }
  write(
    PREFS_KEY,
    JSON.stringify({ model: state.model, rememberKey: state.rememberKey, saveSessions: state.saveSessions }),
  )
  write(API_KEY_KEY, state.rememberKey && state.apiKey ? state.apiKey : null)
  listeners.forEach((l) => l())
}

export function clearApiKey(): void {
  updateSettings({ apiKey: '' })
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings)
}
