import { useEffect, useRef, useState } from 'react'

export default function useDebounce(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timerRef.current)
  }, [value, delay])

  return debouncedValue
}
