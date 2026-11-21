import { DEFAULT_MODEL } from '../../configs/app'
import { GeminiError, classifyHttpError } from './errors'

const BASE = 'https://generativelanguage.googleapis.com/v1beta'

/** Model ids are put in the request URL, so only allow plain characters. */
export const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/

export type Part = { text: string } | { inline_data: { mime_type: string; data: string } }

interface GenerateResponse {
  candidates?: Array<{
    finishReason?: string
    content?: { parts?: Array<{ text?: string; thought?: boolean }> }
  }>
  promptFeedback?: { blockReason?: string }
}

async function request(url: string, init: RequestInit, signal?: AbortSignal): Promise<unknown> {
  let res: Response
  try {
    res = await fetch(url, { ...init, signal, referrerPolicy: 'no-referrer' })
  } catch (e) {
    if (signal?.aborted) throw new GeminiError('aborted', 'Cancelled.')
    throw new GeminiError('network', e instanceof Error ? e.message : 'Network error')
  }
  const raw = await res.text()
  let body: unknown = null
  try {
    body = raw ? JSON.parse(raw) : null
  } catch {
    body = null
  }
  if (!res.ok) throw classifyHttpError(res.status, body)
  return body
}

function headers(apiKey: string): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }
}

export interface GenerateOptions {
  apiKey: string
  model: string
  system?: string
  parts: Part[]
  temperature?: number
  signal?: AbortSignal
}

/** One generateContent call that must come back as JSON text. */
export async function generateJsonText(o: GenerateOptions): Promise<string> {
  if (!o.apiKey) throw new GeminiError('no_key', 'No API key.')
  if (!MODEL_ID_PATTERN.test(o.model)) throw new GeminiError('model_not_found', 'Invalid model name.')

  const body = (await request(
    `${BASE}/models/${encodeURIComponent(o.model)}:generateContent`,
    {
      method: 'POST',
      headers: headers(o.apiKey),
      body: JSON.stringify({
        systemInstruction: o.system ? { parts: [{ text: o.system }] } : undefined,
        contents: [{ role: 'user', parts: o.parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: o.temperature ?? 0.2,
        },
      }),
    },
    o.signal,
  )) as GenerateResponse | null

  const candidate = body?.candidates?.[0]
  if (!candidate) {
    if (body?.promptFeedback?.blockReason) throw new GeminiError('blocked', body.promptFeedback.blockReason)
    throw new GeminiError('invalid_response', 'Empty answer from Gemini.')
  }
  if (candidate.finishReason && /SAFETY|PROHIBITED|BLOCKLIST|SPII|RECITATION/.test(candidate.finishReason)) {
    throw new GeminiError('blocked', candidate.finishReason)
  }
  const text = (candidate.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')
  if (!text.trim()) throw new GeminiError('invalid_response', 'Empty answer from Gemini.')
  return text
}

/** Parses JSON from the model, tolerating ```json fences or text around it. */
export function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const start = trimmed.indexOf('{')
    const end = trimmed.lastIndexOf('}')
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1))
      } catch {
        /* fall through */
      }
    }
    throw new GeminiError('invalid_response', 'The answer from Gemini was not valid JSON.')
  }
}

export interface ModelInfo {
  id: string
  displayName: string
}

const EXCLUDED_MODEL = /embedding|aqa|imagen|veo|tts|image|live|audio|robotics|computer-use|learnlm|gemma/i

/** Models this key can use for text generation, newest names first. */
export async function listModels(apiKey: string, signal?: AbortSignal): Promise<ModelInfo[]> {
  if (!apiKey) throw new GeminiError('no_key', 'No API key.')
  const body = (await request(`${BASE}/models?pageSize=1000`, { headers: headers(apiKey) }, signal)) as {
    models?: Array<{ name?: string; displayName?: string; supportedGenerationMethods?: string[] }>
  } | null

  return (body?.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => ({ id: (m.name ?? '').replace(/^models\//, ''), displayName: m.displayName ?? '' }))
    .filter((m) => m.id.startsWith('gemini') && !EXCLUDED_MODEL.test(m.id) && MODEL_ID_PATTERN.test(m.id))
    .sort((a, b) => b.id.localeCompare(a.id, 'en', { numeric: true }))
}

/** Picks a sensible default: the newest stable "gemini-X-flash" model, else the configured default. */
export function pickDefaultModel(ids: readonly string[]): string {
  const stableFlash = ids
    .map((id) => ({ id, m: id.match(/^gemini-(\d+(?:\.\d+)?)-flash$/) }))
    .filter((x) => x.m)
    .sort((a, b) => parseFloat(b.m![1]) - parseFloat(a.m![1]))
  if (stableFlash.length) return stableFlash[0].id
  if (ids.includes(DEFAULT_MODEL)) return DEFAULT_MODEL
  const flash = ids.find((id) => /flash/.test(id) && !/lite|exp|preview/.test(id))
  return flash ?? ids[0] ?? DEFAULT_MODEL
}
