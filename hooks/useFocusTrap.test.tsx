import { useRef, useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useFocusTrap, useScrollLock } from './useFocusTrap'

function Panel({ onEscape }: { onEscape: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, () => {
    onEscape()
    setOpen(false)
  })
  useScrollLock(open)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      {open && (
        <div ref={ref} tabIndex={-1}>
          <button type="button">First</button>
          <a href="#middle">Middle</a>
          <button type="button">Last</button>
          <button type="button" disabled>Disabled</button>
        </div>
      )}
    </>
  )
}

function openPanel(onEscape = jest.fn()) {
  render(<Panel onEscape={onEscape} />)
  const opener = screen.getByRole('button', { name: 'Open' })
  opener.focus()
  fireEvent.click(opener)
  return { opener, onEscape }
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when it opens', () => {
    openPanel()
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })

  it('wraps Tab from the last element to the first, skipping disabled ones', () => {
    openPanel()
    screen.getByRole('button', { name: 'Last' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })

  it('wraps Shift+Tab from the first element to the last', () => {
    openPanel()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus()
  })

  it('calls onEscape on Escape and returns focus to the opener', () => {
    const { opener, onEscape } = openPanel()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onEscape).toHaveBeenCalledTimes(1)
    expect(opener).toHaveFocus()
  })
})

describe('useScrollLock', () => {
  it('locks body scroll while active and restores it afterwards', () => {
    document.body.style.overflow = 'auto'
    openPanel()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(document.body.style.overflow).toBe('auto')
  })
})
