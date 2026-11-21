import { describe, expect, it } from 'vitest'
import { processEvaluation, quoteInText } from '../src/lib/issues'
import { GeminiError } from '../src/lib/gemini/errors'
import { RawEvaluationSchema } from '../src/lib/schema'

const essay = `The graph show that sales has increased between 2010 and 2020.
In addition, the number of shops “doubled”, wich was suprising.`

describe('quoteInText', () => {
  it('finds exact quotes', () => {
    expect(quoteInText('The graph show that sales has increased', essay)).toBe(true)
  })
  it('ignores case, spacing and curly quotes', () => {
    expect(quoteInText('the  graph SHOW that', essay)).toBe(true)
    expect(quoteInText('the number of shops "doubled"', essay)).toBe(true)
  })
  it('tolerates a trailing period and surrounding quote marks', () => {
    expect(quoteInText('"wich was suprising."', essay)).toBe(true)
    expect(quoteInText('between 2010 and 2020..', essay)).toBe(true)
  })
  it('supports ... to skip words', () => {
    expect(quoteInText('The graph show ... between 2010 and 2020', essay)).toBe(true)
    expect(quoteInText('between 2010 ... The graph show', essay)).toBe(false)
  })
  it('rejects invented quotes', () => {
    expect(quoteInText('sales have decreased', essay)).toBe(false)
    expect(quoteInText('', essay)).toBe(false)
  })
})

function raw(overrides: Record<string, unknown> = {}) {
  return RawEvaluationSchema.parse({
    confidence: 'Medium',
    summary: 'OK',
    criteria: [
      { name: 'Task Response', band: 6.5, evidence: ['The graph show that'], feedback: 'f', next_step: 'n' },
      { name: 'Coherence and Cohesion', band: '6', evidence: ['In addition'], feedback: 'f', next_step: 'n' },
      { name: 'Lexical Resource', band: 5.7, evidence: ['not in the essay'], feedback: 'f', next_step: 'n' },
      { name: 'Grammatical Range & Accuracy', band: 6, evidence: ['sales has increased'], feedback: 'f', next_step: 'n' },
    ],
    issues: [
      { category: 'Grammar', criterion: 'Grammatical Range and Accuracy', rule: 'subject-verb agreement', original: 'The graph show that sales has increased', explanation: 'e', correction: 'c', better_version: 'b' },
      { category: 'spelling', criterion: '', original: 'wich', explanation: 'e', correction: 'which', better_version: null },
      { category: 'spelling', criterion: '', original: 'invented mistake', explanation: 'e', correction: 'x' },
      { category: 'unknown-kind', original: 'The graph' },
    ],
    strengths: ['clear'],
    improvements: [
      { priority: 2, issue: 'b', evidence: 'nope', action: 'do b' },
      { priority: 1, issue: 'a', evidence: 'wich', action: 'do a' },
    ],
    ...overrides,
  })
}

describe('processEvaluation', () => {
  const ctx = { task: 'task2' as const, answer: essay, model: 'gemini-test' }

  it('keeps only issues whose quote is in the essay', () => {
    const r = processEvaluation(raw(), ctx)
    expect(r.issues.map((i) => i.original)).toEqual(['The graph show that sales has increased', 'wich'])
    expect(r.issues_discarded).toBe(1)
    expect(r.issues[1].criterion).toBe('Lexical Resource')
    expect(r.issues.map((i) => i.id)).toEqual([1, 2])
  })

  it('snaps bands, maps criterion names and calculates the overall band in code', () => {
    const r = processEvaluation(raw(), ctx)
    expect(r.criteria.map((c) => c.name)).toEqual([
      'Task Response',
      'Coherence and Cohesion',
      'Lexical Resource',
      'Grammatical Range and Accuracy',
    ])
    expect(r.criteria.map((c) => c.band)).toEqual([6.5, 6, 5.5, 6])
    expect(r.overall_band).toBe(6) // average 6.0
    expect(r.confidence).toBe('medium')
  })

  it('hides feedback when no evidence quote is real', () => {
    const r = processEvaluation(raw(), ctx)
    expect(r.criteria[2].feedback_hidden).toBe(true)
    expect(r.criteria[0].feedback_hidden).toBe(false)
  })

  it('orders improvements and drops evidence that is not in the essay', () => {
    const r = processEvaluation(raw(), ctx)
    expect(r.improvements.map((i) => [i.priority, i.issue, i.evidence])).toEqual([
      [1, 'a', 'wich'],
      [2, 'b', null],
    ])
  })

  it('fails when a criterion is missing', () => {
    const bad = raw()
    bad.criteria[3].name = 'Pronunciation'
    expect(() => processEvaluation(bad, ctx)).toThrow(GeminiError)
  })

  it('rejects answers without four criteria', () => {
    expect(RawEvaluationSchema.safeParse({ criteria: [] }).success).toBe(false)
  })
})
