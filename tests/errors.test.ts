import { describe, expect, it } from 'vitest'
import { withRetries } from '../src/lib/evaluate'
import { classifyHttpError, GeminiError } from '../src/lib/gemini/errors'

// Sample error bodies in the shape the Gemini API returns.
const invalidKey = {
  error: {
    code: 400,
    message: 'API key not valid. Please pass a valid API key.',
    status: 'INVALID_ARGUMENT',
    details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID', domain: 'googleapis.com' }],
  },
}

const perMinute = {
  error: {
    code: 429,
    message: 'You exceeded your current quota, please check your plan and billing details.',
    status: 'RESOURCE_EXHAUSTED',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
        violations: [{ quotaMetric: 'generativelanguage.googleapis.com/generate_content_free_tier_requests', quotaId: 'GenerateRequestsPerMinutePerProjectPerModel-FreeTier' }],
      },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '23s' },
    ],
  },
}

const perDay = {
  error: {
    code: 429,
    message: 'You exceeded your current quota, please check your plan and billing details.',
    status: 'RESOURCE_EXHAUSTED',
    details: [
      {
        '@type': 'type.googleapis.com/google.rpc.QuotaFailure',
        violations: [{ quotaId: 'GenerateRequestsPerDayPerProjectPerModel-FreeTier' }],
      },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '3s' },
    ],
  },
}

describe('classifyHttpError', () => {
  it('detects an invalid key (400 API_KEY_INVALID)', () => {
    expect(classifyHttpError(400, invalidKey).kind).toBe('invalid_key')
  })
  it('detects permission problems as key problems', () => {
    expect(classifyHttpError(403, { error: { code: 403, message: 'Permission denied', status: 'PERMISSION_DENIED' } }).kind).toBe('invalid_key')
  })
  it('separates per-minute rate limits from daily quota', () => {
    const minute = classifyHttpError(429, perMinute)
    expect(minute.kind).toBe('rate_limit')
    expect(minute.retryAfterMs).toBe(23_000)
    expect(classifyHttpError(429, perDay).kind).toBe('quota')
  })
  it('uses RetryInfo when no quota id is given', () => {
    expect(classifyHttpError(429, { error: { message: 'Resource exhausted', details: [{ '@type': 'x.RetryInfo', retryDelay: '10s' }] } }).kind).toBe('rate_limit')
    expect(classifyHttpError(429, { error: { message: 'Resource exhausted' } }).kind).toBe('quota')
  })
  it('maps server errors, missing models and bodies that are not JSON', () => {
    expect(classifyHttpError(503, { error: { code: 503, message: 'The model is overloaded.' } }).kind).toBe('server')
    expect(classifyHttpError(500, null).kind).toBe('server')
    expect(classifyHttpError(404, { error: { message: 'models/x is not found' } }).kind).toBe('model_not_found')
    expect(classifyHttpError(400, { error: { message: 'User location is not supported' } }).kind).toBe('bad_request')
  })
})

describe('withRetries', () => {
  const noWait = async () => {}

  it('retries a server error once', async () => {
    let calls = 0
    const result = await withRetries(async () => {
      calls++
      if (calls === 1) throw new GeminiError('server', 'down')
      return 'ok'
    }, undefined, noWait)
    expect(result).toBe('ok')
    expect(calls).toBe(2)
  })

  it('turns a repeated rate limit into a quota error', async () => {
    let calls = 0
    await expect(
      withRetries(async () => {
        calls++
        throw new GeminiError('rate_limit', 'slow down')
      }, undefined, noWait),
    ).rejects.toMatchObject({ kind: 'quota' })
    expect(calls).toBe(2)
  })

  it('does not retry an invalid key', async () => {
    let calls = 0
    await expect(
      withRetries(async () => {
        calls++
        throw new GeminiError('invalid_key', 'bad')
      }, undefined, noWait),
    ).rejects.toMatchObject({ kind: 'invalid_key' })
    expect(calls).toBe(1)
  })

  it('retries an unreadable answer once, then gives up', async () => {
    let calls = 0
    await expect(
      withRetries(async () => {
        calls++
        throw new GeminiError('invalid_response', 'bad json')
      }, undefined, noWait),
    ).rejects.toMatchObject({ kind: 'invalid_response' })
    expect(calls).toBe(2)
  })
})
