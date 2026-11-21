import { describe, expect, it } from 'vitest'
import { overallBand } from '../src/lib/scoring'

describe('overallBand (IELTS rounding)', () => {
  it.each([
    [[6, 6, 6, 6], 6],
    [[6.5, 6.5, 6.5, 6.5], 6.5],
    // average 6.125 -> rounds down
    [[6, 6, 6, 6.5], 6],
    // average 6.25 -> rounds up to 6.5
    [[6, 6, 6.5, 6.5], 6.5],
    // average 6.375 -> 6.5
    [[6, 6.5, 6.5, 6.5], 6.5],
    // average 6.625 -> 6.5
    [[6.5, 6.5, 6.5, 7], 6.5],
    // average 6.75 -> rounds up to 7
    [[6.5, 6.5, 7, 7], 7],
    // average 6.875 -> 7
    [[6.5, 7, 7, 7], 7],
    [[5, 6, 7, 8], 6.5],
    [[0, 0, 0, 0], 0],
    [[9, 9, 9, 9], 9],
  ])('%j -> %d', (bands, expected) => {
    expect(overallBand(bands)).toBe(expected)
  })
})
