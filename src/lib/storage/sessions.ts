import { LIMITS, type TaskType } from '../../configs/app'
import { StoredSessionSchema, type ChartData, type EvaluationResult } from '../schema'

/**
 * Past evaluations, saved in this browser's IndexedDB (localStorage is too
 * small for chart images). Nothing here is ever sent to a server, and API
 * keys are never part of a session.
 */
export interface Session {
  id: string
  createdAt: number
  task: TaskType
  question: string
  answer: string
  model: string
  chartData?: ChartData
  /** Compressed chart image as a data: URL (Task 1). */
  chartImage?: string
  result: EvaluationResult
}

export type SessionSummary = Pick<Session, 'id' | 'createdAt' | 'task' | 'question' | 'model'> & {
  band: number
}

const DB_NAME = 'ielts-writing-checker'
const STORE = 'sessions'
const EXPORT_APP = 'ielts-writing-checker'

/** Sessions kept only for this visit (when saving is switched off). */
const memory = new Map<string, Session>()

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id' }).createIndex('createdAt', 'createdAt')
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    dbPromise.catch(() => {
      dbPromise = null
    })
  }
  return dbPromise
}

function done<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function store(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDb()
  return db.transaction(STORE, mode).objectStore(STORE)
}

async function allStored(): Promise<Session[]> {
  try {
    return (await done((await store('readonly')).getAll())) as Session[]
  } catch {
    return []
  }
}

/** Keeps only the newest sessions. */
async function prune(): Promise<void> {
  const all = (await allStored()).sort((a, b) => b.createdAt - a.createdAt)
  const extra = all.slice(LIMITS.maxSessions)
  if (!extra.length) return
  const s = await store('readwrite')
  await Promise.all(extra.map((x) => done(s.delete(x.id))))
}

export function newSessionId(): string {
  return crypto.randomUUID()
}

export async function saveSession(session: Session, persist: boolean): Promise<void> {
  if (!persist) {
    memory.set(session.id, session)
    return
  }
  try {
    await done((await store('readwrite')).put(session))
    await prune()
  } catch {
    // IndexedDB unavailable (private mode etc.): keep it for this visit only.
    memory.set(session.id, session)
  }
}

export async function getSession(id: string): Promise<Session | null> {
  const cached = memory.get(id)
  if (cached) return cached
  try {
    return ((await done((await store('readonly')).get(id))) as Session | undefined) ?? null
  } catch {
    return null
  }
}

export async function listSessions(): Promise<SessionSummary[]> {
  const byId = new Map<string, Session>()
  for (const s of await allStored()) byId.set(s.id, s)
  for (const s of memory.values()) byId.set(s.id, s)
  return [...byId.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      task: s.task,
      question: s.question,
      model: s.model,
      band: s.result.overall_band,
    }))
}

export async function deleteSession(id: string): Promise<void> {
  memory.delete(id)
  try {
    await done((await store('readwrite')).delete(id))
  } catch {
    /* nothing stored */
  }
}

export async function clearSessions(): Promise<void> {
  memory.clear()
  try {
    await done((await store('readwrite')).clear())
  } catch {
    /* nothing stored */
  }
}

export async function exportSessions(): Promise<string> {
  const sessions = [...new Map([...(await allStored()), ...memory.values()].map((s) => [s.id, s])).values()]
  return JSON.stringify({ app: EXPORT_APP, version: 1, exportedAt: new Date().toISOString(), sessions }, null, 2)
}

export async function importSessions(json: string): Promise<{ imported: number; skipped: number }> {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('This file is not valid JSON.')
  }
  const list = Array.isArray(data) ? data : (data as { sessions?: unknown })?.sessions
  if (!Array.isArray(list)) throw new Error('This file does not contain any sessions.')

  const valid: Session[] = []
  for (const item of list) {
    const parsed = StoredSessionSchema.safeParse(item)
    if (parsed.success) valid.push(parsed.data as unknown as Session)
  }
  if (valid.length) {
    const s = await store('readwrite')
    await Promise.all(valid.map((v) => done(s.put(v))))
    await prune()
  }
  return { imported: valid.length, skipped: list.length - valid.length }
}
