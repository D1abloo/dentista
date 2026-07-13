import { useEffect, useState } from 'react'

export const useOnline = () => {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return online
}

export type AsyncState<T> =
  | { status: 'idle' | 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'empty' }

export const useAsync = <T,>(loader: () => Promise<T>, deps: unknown[] = []) => {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    loader()
      .then((data) => {
        if (cancelled) return
        if (data == null || (Array.isArray(data) && data.length === 0)) {
          setState({ status: 'empty' })
          return
        }
        setState({ status: 'success', data })
      })
      .catch((err) => {
        if (cancelled) return
        setState({
          status: 'error',
          error: err instanceof Error ? err.message : 'Error inesperado'
        })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
