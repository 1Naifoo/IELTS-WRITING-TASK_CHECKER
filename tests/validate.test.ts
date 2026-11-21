import { describe, expect, it } from 'vitest'
import { pickDefaultModel, parseJsonLoose } from '../src/lib/gemini/client'
import { ChartDataSchema } from '../src/lib/schema'
import { checkTextInput, countWords, latinRatio } from '../src/lib/validate'

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ')

describe('countWords', () => {
  it('counts words, contractions, hyphenated words and numbers', () => {
    expect(countWords("It's a well-known fact that 45% of people agree.")).toBe(9)
    expect(countWords('   ')).toBe(0)
  })
})

describe('checkTextInput', () => {
  it('blocks empty fields', () => {
    const r = checkTextInput('task2', '', '')
    expect(r.errors.question).toBeTruthy()
    expect(r.errors.answer).toBeTruthy()
  })
  it('requires the chart image for Task 1', () => {
    expect(checkTextInput('task1', 'q', words(160), false).errors.image).toBeTruthy()
    expect(checkTextInput('task1', 'q', words(160), true).errors.image).toBeUndefined()
  })
  it('warns but does not block under the minimum word count', () => {
    const r = checkTextInput('task2', 'q', words(200))
    expect(r.errors).toEqual({})
    expect(r.warnings.join(' ')).toMatch(/250/)
  })
  it('blocks text that is far too long', () => {
    expect(checkTextInput('task2', 'q', 'a'.repeat(13000)).errors.answer).toMatch(/too long/)
  })
  it('warns when the answer is mostly not English', () => {
    expect(latinRatio('هذا نص باللغة العربية')).toBeLessThan(0.1)
    expect(checkTextInput('task2', 'q', `${'كلمة '.repeat(260)}`).warnings.join(' ')).toMatch(/English/)
  })
})

describe('parseJsonLoose', () => {
  it('reads plain and fenced JSON', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 })
    expect(parseJsonLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })
  it('throws on non-JSON', () => {
    expect(() => parseJsonLoose('sorry, I cannot')).toThrow()
  })
})

describe('pickDefaultModel', () => {
  it('prefers the newest stable flash model', () => {
    expect(pickDefaultModel(['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-3-flash', 'gemini-3-flash-preview'])).toBe('gemini-3-flash')
  })
  it('falls back sensibly', () => {
    expect(pickDefaultModel(['gemini-9-pro-preview', 'gemini-9-flash-lite'])).toBe('gemini-9-pro-preview')
  })
})

describe('ChartDataSchema', () => {
  it('fills missing fields and normalises values', () => {
    const d = ChartDataSchema.parse({
      chart_type: 'Bar',
      data_points: [{ label: 'UK', value: 45 }, { label: 'US', value: null, uncertain: true }],
      trends: ['up', null, ''],
    })
    expect(d.chart_type).toBe('bar')
    expect(d.title).toBe('')
    expect(d.data_points).toEqual([
      { label: 'UK', value: '45', uncertain: false },
      { label: 'US', value: '', uncertain: true },
    ])
    expect(d.trends).toEqual(['up'])
  })
  it('accepts an unknown chart type as "other"', () => {
    expect(ChartDataSchema.parse({ chart_type: 'radar' }).chart_type).toBe('other')
  })
})
