import type { TaskType } from '../configs/app'
import { generateJsonText, parseJsonLoose, type Part } from './gemini/client'
import { GeminiError, asGeminiError } from './gemini/errors'
import { processEvaluation } from './issues'
import { buildExtractPrompt, EXTRACT_SYSTEM } from './prompts/task1-extract'
import { buildTask1EvaluatePrompt } from './prompts/task1-evaluate'
import { buildTask2EvaluatePrompt } from './prompts/task2-evaluate'
import { EVALUATION_SYSTEM } from './prompts/shared'
import { ChartDataSchema, RawEvaluationSchema, type ChartData, type EvaluationResult } from './schema'

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t)
        reject(new GeminiError('aborted', 'Cancelled.'))
      },
      { once: true },
    )
  })
}

/**
 * Retry policy (spec section 8, Gemini only):
 * - short rate limit: wait, retry once; a second rate limit is treated as quota used up
 * - server error (5xx): retry once
 * - unreadable answer: retry once
 * - everything else (bad key, quota, network...) goes straight to the learner
 */
export async function withRetries<T>(
  fn: () => Promise<T>,
  signal?: AbortSignal,
  wait: (ms: number, signal?: AbortSignal) => Promise<void> = sleep,
): Promise<T> {
  const retried = new Set<string>()
  for (;;) {
    try {
      return await fn()
    } catch (e) {
      const err = asGeminiError(e)
      if (signal?.aborted || err.kind === 'aborted') throw new GeminiError('aborted', 'Cancelled.')
      const retryable = err.kind === 'rate_limit' || err.kind === 'server' || err.kind === 'invalid_response'
      if (!retryable) throw err
      if (retried.has(err.kind)) {
        if (err.kind === 'rate_limit') throw new GeminiError('quota', err.message, { status: err.status })
        throw err
      }
      retried.add(err.kind)
      const delay =
        err.kind === 'rate_limit' ? Math.min(Math.max(err.retryAfterMs ?? 5000, 2000), 30_000) : 1500
      await wait(delay, signal)
    }
  }
}

function parseWith<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, text: string): T {
  const parsed = schema.safeParse(parseJsonLoose(text))
  if (!parsed.success) throw new GeminiError('invalid_response', 'The answer from Gemini did not match the expected format.')
  return parsed.data
}

export interface Connection {
  apiKey: string
  model: string
  signal?: AbortSignal
}

export interface PreparedImage {
  base64: string
  mimeType: string
}

export async function extractChartData(
  conn: Connection,
  question: string,
  image: PreparedImage,
): Promise<ChartData> {
  const parts: Part[] = [
    { text: buildExtractPrompt(question) },
    { inline_data: { mime_type: image.mimeType, data: image.base64 } },
  ]
  return withRetries(async () => {
    const text = await generateJsonText({ ...conn, system: EXTRACT_SYSTEM, parts, temperature: 0 })
    return parseWith(ChartDataSchema, text)
  }, conn.signal)
}

export async function evaluateAnswer(
  conn: Connection,
  input: { task: TaskType; question: string; answer: string; chartData?: ChartData },
): Promise<EvaluationResult> {
  if (input.task === 'task1' && !input.chartData) throw new Error('Task 1 needs confirmed chart data.')
  const prompt =
    input.task === 'task1'
      ? buildTask1EvaluatePrompt(input.question, input.answer, input.chartData!)
      : buildTask2EvaluatePrompt(input.question, input.answer)

  return withRetries(async () => {
    const text = await generateJsonText({
      ...conn,
      system: EVALUATION_SYSTEM,
      parts: [{ text: prompt }],
      temperature: 0.2,
    })
    const raw = parseWith(RawEvaluationSchema, text)
    return processEvaluation(raw, { task: input.task, answer: input.answer, model: conn.model })
  }, conn.signal)
}
