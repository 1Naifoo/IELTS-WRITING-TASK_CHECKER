/**
 * Every Gemini failure is turned into one of these kinds, in this one file,
 * so the rest of the app can react the same way wherever the call was made.
 * Google's error format can change, so tests/errors.test.ts holds sample responses.
 */
export type ErrorKind =
  | 'no_key'
  | 'invalid_key'
  | 'quota'
  | 'rate_limit'
  | 'server'
  | 'model_not_found'
  | 'invalid_response'
  | 'blocked'
  | 'bad_request'
  | 'network'
  | 'aborted'

export class GeminiError extends Error {
  readonly kind: ErrorKind
  readonly status?: number
  readonly retryAfterMs?: number

  constructor(kind: ErrorKind, message: string, opts: { status?: number; retryAfterMs?: number } = {}) {
    super(message)
    this.name = 'GeminiError'
    this.kind = kind
    this.status = opts.status
    this.retryAfterMs = opts.retryAfterMs
  }
}

interface GoogleErrorBody {
  error?: {
    code?: number
    message?: string
    status?: string
    details?: Array<Record<string, unknown>>
  }
}

function parseDelay(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined
  const m = value.match(/^(\d+(?:\.\d+)?)s$/)
  return m ? Math.round(parseFloat(m[1]) * 1000) : undefined
}

export function classifyHttpError(status: number, body: unknown): GeminiError {
  const err = (body as GoogleErrorBody | null)?.error ?? {}
  const message = typeof err.message === 'string' && err.message ? err.message : `HTTP ${status}`
  const details = Array.isArray(err.details) ? err.details : []
  const typeOf = (d: Record<string, unknown>) => String(d['@type'] ?? '')

  const reasons = details.map((d) => (typeof d.reason === 'string' ? d.reason : ''))
  const retryAfterMs = parseDelay(details.find((d) => typeOf(d).endsWith('RetryInfo'))?.retryDelay)
  const quotaIds = details.flatMap((d) =>
    Array.isArray(d.violations)
      ? d.violations.map((v: unknown) => String((v as { quotaId?: unknown })?.quotaId ?? ''))
      : [],
  )
  const opts = { status, retryAfterMs }

  if (
    reasons.includes('API_KEY_INVALID') ||
    /api key (not valid|invalid|expired)|api_key_invalid/i.test(message)
  ) {
    return new GeminiError('invalid_key', message, opts)
  }
  if (status === 401 || status === 403) return new GeminiError('invalid_key', message, opts)
  if (status === 404) return new GeminiError('model_not_found', message, opts)

  if (status === 429) {
    const perDay = quotaIds.some((q) => /per ?day/i.test(q))
    const perMinute = quotaIds.some((q) => /per ?minute/i.test(q))
    // The quota id is the reliable signal; the message says "billing" for both kinds.
    if (perDay) return new GeminiError('quota', message, opts)
    if (perMinute) return new GeminiError('rate_limit', message, opts)
    if (/per day|daily/i.test(message)) return new GeminiError('quota', message, opts)
    if (retryAfterMs !== undefined && retryAfterMs <= 60_000) return new GeminiError('rate_limit', message, opts)
    return new GeminiError('quota', message, opts)
  }

  if (status >= 500) return new GeminiError('server', message, opts)
  return new GeminiError('bad_request', message, opts)
}

export function asGeminiError(e: unknown): GeminiError {
  if (e instanceof GeminiError) return e
  if (e instanceof DOMException && e.name === 'AbortError') return new GeminiError('aborted', 'Cancelled.')
  return new GeminiError('invalid_response', e instanceof Error ? e.message : String(e))
}

/** Plain-language message for the learner. */
export function userMessage(err: GeminiError, model?: string): string {
  switch (err.kind) {
    case 'no_key':
      return 'Add your Gemini API key in Settings first.'
    case 'invalid_key':
      return 'Gemini rejected your API key. Check that it was copied correctly in Settings.'
    case 'quota':
      return 'Your free Gemini quota for this model is used up for now. Wait for it to reset, or choose a different model in Settings. Your essay is still here.'
    case 'rate_limit':
      return 'Too many requests in a short time. Wait a minute, then try again.'
    case 'server':
      return 'Gemini is busy or temporarily down. Please try again in a moment.'
    case 'model_not_found':
      return `The model${model ? ` "${model}"` : ''} is not available for your key. Choose another model in Settings.`
    case 'invalid_response':
      return 'Gemini sent an answer the app could not read. Please try again.'
    case 'blocked':
      return 'Gemini declined to answer this request. Check your text and image, then try again.'
    case 'network':
      return 'Could not reach Gemini. Check your internet connection and try again.'
    case 'aborted':
      return 'The request was cancelled.'
    case 'bad_request':
      return `Gemini could not handle this request: ${err.message}`
  }
}

/** Errors the learner fixes in Settings rather than by retrying. */
export function needsSettings(err: GeminiError): boolean {
  return err.kind === 'no_key' || err.kind === 'invalid_key' || err.kind === 'model_not_found'
}
