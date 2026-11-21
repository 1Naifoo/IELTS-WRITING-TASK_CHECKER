import { z } from 'zod'
import type { TaskType } from '../configs/app'

/* ---------- helpers ---------- */

/** Optional text: null/undefined become '', everything is trimmed. */
const text = z
  .string()
  .nullish()
  .transform((v) => (v ?? '').trim())

/** Like `text` but keeps null when the model sends no value. */
const nullableText = z
  .string()
  .nullish()
  .transform((v) => {
    const t = (v ?? '').trim()
    return t ? t : null
  })

const textList = z
  .array(z.string().nullish())
  .nullish()
  .transform((list) => (list ?? []).map((s) => (s ?? '').trim()).filter(Boolean))

function looseEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(
    (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
    z.enum(values),
  )
}

/** A band from 0 to 9, snapped to the nearest half band. */
export const halfBand = z.coerce
  .number()
  .refine((v) => Number.isFinite(v), 'band must be a number')
  .transform((v) => Math.min(9, Math.max(0, Math.round(v * 2) / 2)))

/* ---------- Task 1 chart data (extraction + user confirmation) ---------- */

export const CHART_TYPES = ['line', 'bar', 'pie', 'table', 'process', 'map', 'mixed', 'other'] as const

export const DataPointSchema = z.object({
  label: text,
  value: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((v) => (v == null ? '' : String(v).trim())),
  uncertain: z.boolean().nullish().transform((v) => v === true),
})

export const ChartDataSchema = z.object({
  chart_type: looseEnum(CHART_TYPES).catch('other'),
  title: text,
  x_axis: text,
  y_axis: text,
  units: text,
  time_period: text,
  data_points: z
    .array(DataPointSchema)
    .nullish()
    .transform((v) => v ?? []),
  trends: textList,
  key_features: textList,
  uncertain_items: textList,
})

export type DataPoint = z.output<typeof DataPointSchema>
export type ChartData = z.output<typeof ChartDataSchema>
export type ChartType = (typeof CHART_TYPES)[number]

export function emptyChartData(): ChartData {
  return {
    chart_type: 'other',
    title: '',
    x_axis: '',
    y_axis: '',
    units: '',
    time_period: '',
    data_points: [],
    trends: [],
    key_features: [],
    uncertain_items: [],
  }
}

/* ---------- Evaluation as returned by the model ---------- */

export const ISSUE_CATEGORIES = ['spelling', 'grammar', 'vocabulary', 'cohesion', 'task'] as const
export type IssueCategory = (typeof ISSUE_CATEGORIES)[number]

export const RawCriterionSchema = z.object({
  name: text,
  band: halfBand,
  evidence: textList,
  feedback: text,
  next_step: text,
})

export const RawIssueSchema = z.object({
  category: looseEnum(ISSUE_CATEGORIES),
  criterion: text,
  rule: nullableText,
  original: z.string().trim().min(1),
  explanation: text,
  correction: text,
  better_version: nullableText,
})

export const RawImprovementSchema = z.object({
  priority: z.coerce.number().catch(99),
  issue: text,
  evidence: nullableText,
  action: text,
})

export const DataNoteSchema = z.object({
  status: looseEnum(['matches', 'contradicts']).catch('matches'),
  quote: nullableText,
  note: text,
})

export const RawEvaluationSchema = z.object({
  confidence: looseEnum(['low', 'medium', 'high']).catch('medium'),
  summary: text,
  criteria: z.array(RawCriterionSchema).min(4),
  issues: z
    .array(z.unknown())
    .nullish()
    .transform((list) =>
      // Drop malformed issues one by one instead of failing the whole result.
      (list ?? []).flatMap((item) => {
        const parsed = RawIssueSchema.safeParse(item)
        return parsed.success ? [parsed.data] : []
      }),
    ),
  issues_truncated: z.boolean().nullish().transform((v) => v === true),
  strengths: textList,
  improvements: z
    .array(RawImprovementSchema)
    .nullish()
    .transform((v) => v ?? []),
  data_accuracy_notes: z
    .array(DataNoteSchema)
    .nullish()
    .transform((v) => v ?? []),
})

export type RawEvaluation = z.output<typeof RawEvaluationSchema>
export type DataNote = z.output<typeof DataNoteSchema>

/* ---------- Final result shown in the app and saved in sessions ---------- */

export interface CriterionResult {
  name: string
  band: number
  evidence: string[]
  feedback: string
  next_step: string
  /** True when the model could not quote evidence that really is in the essay. */
  feedback_hidden: boolean
}

export interface Issue {
  id: number
  category: IssueCategory
  criterion: string
  rule: string | null
  original: string
  explanation: string
  correction: string
  better_version: string | null
}

export interface Improvement {
  priority: number
  issue: string
  evidence: string | null
  action: string
}

export interface EvaluationResult {
  task_type: TaskType
  confidence: 'low' | 'medium' | 'high'
  summary: string
  overall_band: number
  criteria: CriterionResult[]
  issues: Issue[]
  /** Issues dropped because their quote is not in the essay. */
  issues_discarded: number
  /** True when the model found more issues than the app shows. */
  issues_truncated: boolean
  strengths: string[]
  improvements: Improvement[]
  data_accuracy_notes: DataNote[]
  word_count: number
  min_words: number
  provider: 'gemini'
  model: string
  disclaimer: string
}

/* ---------- Saved sessions (used to validate imported files) ---------- */

export const StoredSessionSchema = z.object({
  id: z.string().min(1).max(100),
  createdAt: z.number().finite(),
  task: z.enum(['task1', 'task2']),
  question: z.string(),
  answer: z.string(),
  model: z.string(),
  chartData: ChartDataSchema.optional(),
  chartImage: z
    .string()
    .regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/)
    .optional()
    .catch(undefined),
  result: z
    .object({
      task_type: z.enum(['task1', 'task2']),
      overall_band: z.number(),
      criteria: z.array(z.object({ name: z.string(), band: z.number() }).loose()).length(4),
      issues: z.array(z.object({ original: z.string(), category: z.string() }).loose()),
    })
    .loose(),
})
