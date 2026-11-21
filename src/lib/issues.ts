import { CRITERIA, DISCLAIMER, LIMITS, type TaskType } from '../configs/app'
import { overallBand } from './scoring'
import type {
  CriterionResult,
  EvaluationResult,
  Issue,
  IssueCategory,
  RawEvaluation,
} from './schema'
import { countWords } from './validate'
import { GeminiError } from './gemini/errors'

/** Lower-cases and evens out quotes, dashes and spaces so small typography differences don't matter. */
export function normalizeForMatch(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/[‘’‚‛′`]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[‐-―]/g, '-')
    .replace(/…/g, '...')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * True when `quote` really appears in `text`.
 * Tolerates case, whitespace and typographic quote differences, surrounding
 * quote marks, a trailing punctuation mark, and "..." used to skip words.
 */
export function quoteInText(quote: string, text: string): boolean {
  const haystack = normalizeForMatch(text)
  let needle = normalizeForMatch(quote).replace(/^["']+|["']+$/g, '').trim()
  if (needle.length < 1) return false
  if (haystack.includes(needle)) return true

  needle = needle.replace(/[.,;:!?]+$/, '').trim()
  if (needle && haystack.includes(needle)) return true

  if (needle.includes('...')) {
    const parts = needle
      .split('...')
      .map((p) => p.trim())
      .filter(Boolean)
    if (parts.length < 2 || parts.some((p) => p.length < 3)) return false
    let from = 0
    for (const part of parts) {
      const at = haystack.indexOf(part, from)
      if (at === -1) return false
      from = at + part.length
    }
    return true
  }
  return false
}

const CATEGORY_CRITERION: Record<IssueCategory, number> = {
  task: 0,
  cohesion: 1,
  vocabulary: 2,
  spelling: 2,
  grammar: 3,
}

function matchCriterionName(name: string, expected: readonly string[]): string | null {
  const n = normalizeForMatch(name)
  const exact = expected.find((e) => normalizeForMatch(e) === n)
  if (exact) return exact
  if (n.includes('task')) return expected[0]
  if (n.includes('coherence') || n.includes('cohesion')) return expected[1]
  if (n.includes('lexical') || n.includes('vocabulary')) return expected[2]
  if (n.includes('grammar') || n.includes('grammatical')) return expected[3]
  return null
}

export interface ProcessContext {
  task: TaskType
  answer: string
  model: string
}

/**
 * Turns the model's raw answer into the result the app shows:
 * keeps only quotes that are really in the essay, fixes criterion names,
 * caps the issue list and calculates the overall band in code.
 */
export function processEvaluation(raw: RawEvaluation, ctx: ProcessContext): EvaluationResult {
  const expected = CRITERIA[ctx.task]

  const byName = new Map<string, RawEvaluation['criteria'][number]>()
  for (const c of raw.criteria) {
    const name = matchCriterionName(c.name, expected)
    if (name && !byName.has(name)) byName.set(name, c)
  }

  const criteria: CriterionResult[] = expected.map((name) => {
    const c = byName.get(name)
    if (!c) {
      throw new GeminiError('invalid_response', `The answer from Gemini is missing the "${name}" criterion.`)
    }
    const evidence = c.evidence.filter((q) => quoteInText(q, ctx.answer))
    return {
      name,
      band: c.band,
      evidence,
      feedback: c.feedback,
      next_step: c.next_step,
      feedback_hidden: evidence.length === 0,
    }
  })

  const verified = raw.issues.filter((i) => quoteInText(i.original, ctx.answer))
  const seen = new Set<string>()
  const unique = verified.filter((i) => {
    const key = `${i.category}|${normalizeForMatch(i.original)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const issues: Issue[] = unique.slice(0, LIMITS.maxIssues).map((i, index) => ({
    id: index + 1,
    category: i.category,
    criterion: matchCriterionName(i.criterion, expected) ?? expected[CATEGORY_CRITERION[i.category]],
    rule: i.rule,
    original: i.original,
    explanation: i.explanation,
    correction: i.correction,
    better_version: i.better_version,
  }))

  const improvements = [...raw.improvements]
    .filter((imp) => imp.issue || imp.action)
    .sort((a, b) => a.priority - b.priority)
    .map((imp, index) => ({
      priority: index + 1,
      issue: imp.issue,
      evidence: imp.evidence && quoteInText(imp.evidence, ctx.answer) ? imp.evidence : null,
      action: imp.action,
    }))

  const data_accuracy_notes =
    ctx.task === 'task1'
      ? raw.data_accuracy_notes
          .filter((n) => n.note)
          .map((n) => ({ ...n, quote: n.quote && quoteInText(n.quote, ctx.answer) ? n.quote : null }))
      : []

  return {
    task_type: ctx.task,
    confidence: raw.confidence,
    summary: raw.summary,
    overall_band: overallBand(criteria.map((c) => c.band)),
    criteria,
    issues,
    issues_discarded: raw.issues.length - verified.length,
    issues_truncated: raw.issues_truncated || unique.length > LIMITS.maxIssues,
    strengths: raw.strengths,
    improvements,
    data_accuracy_notes,
    word_count: countWords(ctx.answer),
    min_words: LIMITS.minWords[ctx.task],
    provider: 'gemini',
    model: ctx.model,
    disclaimer: DISCLAIMER.full,
  }
}
