import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearSessions,
  exportSessions,
  getSession,
  importSessions,
  listSessions,
  saveSession,
  type Session,
} from '../src/lib/storage/sessions'

function session(n: number, overrides: Partial<Session> = {}): Session {
  return {
    id: `s${n}`,
    createdAt: 1_700_000_000_000 + n,
    task: 'task2',
    question: `Question ${n}`,
    answer: 'Answer',
    model: 'gemini-test',
    result: {
      task_type: 'task2',
      confidence: 'medium',
      summary: '',
      overall_band: 6,
      criteria: ['Task Response', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'].map(
        (name) => ({ name, band: 6, evidence: [], feedback: '', next_step: '', feedback_hidden: true }),
      ),
      issues: [],
      issues_discarded: 0,
      issues_truncated: false,
      strengths: [],
      improvements: [],
      data_accuracy_notes: [],
      word_count: 260,
      min_words: 250,
      provider: 'gemini',
      model: 'gemini-test',
      disclaimer: '',
    },
    ...overrides,
  }
}

beforeEach(async () => {
  await clearSessions()
})

describe('sessions', () => {
  it('saves, lists newest first and loads a session', async () => {
    await saveSession(session(1), true)
    await saveSession(session(2), true)
    const list = await listSessions()
    expect(list.map((s) => s.id)).toEqual(['s2', 's1'])
    expect((await getSession('s1'))?.question).toBe('Question 1')
  })

  it('keeps only the newest 50', async () => {
    for (let i = 0; i < 55; i++) await saveSession(session(i), true)
    const list = await listSessions()
    expect(list).toHaveLength(50)
    expect(list.at(-1)?.id).toBe('s5')
  })

  it('round-trips through export and import, skipping invalid entries', async () => {
    await saveSession(session(1), true)
    const json = await exportSessions()
    await clearSessions()
    const parsed = JSON.parse(json)
    parsed.sessions.push({ id: 'broken' })
    parsed.sessions.push({ ...session(3), chartImage: 'javascript:alert(1)' })
    const { imported, skipped } = await importSessions(JSON.stringify(parsed))
    expect(imported).toBe(2)
    expect(skipped).toBe(1)
    expect((await getSession('s3'))?.chartImage).toBeUndefined()
  })

  it('rejects files that are not session exports', async () => {
    await expect(importSessions('not json')).rejects.toThrow()
    await expect(importSessions('{"foo":1}')).rejects.toThrow()
  })

  it('keeps unsaved sessions in memory only', async () => {
    await saveSession(session(7), false)
    expect((await getSession('s7'))?.id).toBe('s7')
    expect(JSON.parse(await exportSessions()).sessions.map((s: Session) => s.id)).toContain('s7')
  })
})
