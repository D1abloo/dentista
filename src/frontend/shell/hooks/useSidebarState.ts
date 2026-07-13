import { useCallback, useEffect, useState } from 'react'

export const useSidebarState = (storageKey = 'ac_portal_sidebar_collapsed') => {
  const [collapsed, setCollapsed] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(storageKey) === '1')
    } catch {
      setCollapsed(false)
    }
    setReady(true)
  }, [storageKey])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(storageKey, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [storageKey])

  return { collapsed, toggle, ready }
}
