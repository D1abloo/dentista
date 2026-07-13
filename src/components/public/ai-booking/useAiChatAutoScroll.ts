import { useEffect, useRef } from 'react'

type Options = {
  messagesLength: number
  suggestedCount: number
  slotsCount: number
  status: string
  panelActive?: boolean
  scrollBody?: boolean
}

export function useAiChatAutoScroll({
  messagesLength,
  suggestedCount,
  slotsCount,
  status,
  panelActive = false,
  scrollBody = false
}: Options) {
  const messagesRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollToBottom = (el: HTMLElement | null) => {
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }

    const timer = window.setTimeout(() => {
      if (scrollBody) {
        scrollToBottom(bodyRef.current)
      }
      scrollToBottom(messagesRef.current)
      scrollToBottom(chatRef.current)
      if (panelActive || slotsCount > 0) {
        scrollToBottom(panelRef.current)
      }
    }, 80)

    return () => window.clearTimeout(timer)
  }, [messagesLength, suggestedCount, slotsCount, status, panelActive, scrollBody])

  return { messagesRef, chatRef, panelRef, bodyRef }
}
