import { useCallback, useEffect, useRef } from 'react'

/** Gives each Gemini call an AbortSignal and cancels it when the page closes. */
export function useRunner() {
  const ref = useRef<AbortController | null>(null)

  useEffect(() => () => ref.current?.abort(), [])

  const start = useCallback(() => {
    ref.current?.abort()
    ref.current = new AbortController()
    return ref.current.signal
  }, [])

  const cancel = useCallback(() => {
    ref.current?.abort()
    ref.current = null
  }, [])

  return { start, cancel }
}
