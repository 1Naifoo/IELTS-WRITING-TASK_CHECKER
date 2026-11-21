/**
 * Overall Writing band from the four criterion bands.
 *
 * IELTS-style rounding of the average: a fraction below .25 rounds down,
 * .25 up to .75 becomes .5, and .75 or more rounds up to the next band.
 */
export function overallBand(bands: readonly number[]): number {
  if (bands.length === 0) return 0
  const avg = bands.reduce((sum, b) => sum + b, 0) / bands.length
  const whole = Math.floor(avg)
  const fraction = avg - whole
  const EPS = 1e-9
  if (fraction + EPS < 0.25) return whole
  if (fraction + EPS < 0.75) return whole + 0.5
  return whole + 1
}

export function formatBand(band: number): string {
  return band.toFixed(1)
}
