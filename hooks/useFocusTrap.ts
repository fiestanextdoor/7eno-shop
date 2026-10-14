'use client'

import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function focusablesIn(node: HTMLElement): HTMLElement[] {
  return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.closest('[inert]') === null
  )
}

/**
 * Keeps keyboard focus inside `ref` while `active`: focus moves in on open,
 * Tab and Shift+Tab wrap, Escape calls `onEscape`, and focus returns to the
 * element that had it before the panel opened.
 */
export function useFocusTrap<T extends HTMLElement>(
  ref: RefObject<T | null>,
  active: boolean,
  onEscape?: () => void
): void {
  const onEscapeRef = useRef(onEscape)
  useEffect(() => {
    onEscapeRef.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const node = ref.current
    if (!node) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ;(focusablesIn(node)[0] ?? node).focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscapeRef.current?.()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusablesIn(node)
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [active, ref])
}

/** Stops the page behind an open panel from scrolling; restores the old value on close. */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [active])
}
