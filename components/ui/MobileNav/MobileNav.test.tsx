import type { ReactNode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileNav from './MobileNav'
import { MAIN_NAV } from '@/lib/nav'

// next/link navigates through the mounted app router, which a unit test does
// not have (a click would throw "Router action dispatched before
// initialization"). A plain anchor that cancels the navigation is enough to
// test our own click handlers.
jest.mock('next/link', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react')
  return {
    __esModule: true,
    default: (props: { href: string; className?: string; onClick?: () => void; children?: ReactNode; 'aria-current'?: 'page' | 'true' }) =>
      createElement(
        'a',
        {
          href: props.href,
          className: props.className,
          'aria-current': props['aria-current'],
          onClick: (event: { preventDefault(): void }) => {
            event.preventDefault()
            props.onClick?.()
          },
        },
        props.children
      ),
  }
})

describe('MobileNav', () => {
  it('is a labelled modal that takes focus on open', () => {
    render(<MobileNav nav={MAIN_NAV} open onClose={jest.fn()} currentPath="/" />)
    expect(screen.getByRole('dialog', { name: 'Menu' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveFocus()
  })

  it('closes on Escape and on the close button', () => {
    const onClose = jest.fn()
    render(<MobileNav nav={MAIN_NAV} open onClose={onClose} currentPath="/" />)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('closes when a link is followed', () => {
    const onClose = jest.fn()
    render(<MobileNav nav={MAIN_NAV} open onClose={onClose} currentPath="/" />)
    fireEvent.click(screen.getByRole('link', { name: 'Archive' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('marks the current section', () => {
    render(<MobileNav nav={MAIN_NAV} open onClose={jest.fn()} currentPath="/shop/olympian-tee-sand-unisex" />)
    expect(screen.getByRole('link', { name: 'Shop' })).toHaveAttribute('aria-current', 'page')
  })

  it('is inert while closed', () => {
    render(<MobileNav nav={MAIN_NAV} open={false} onClose={jest.fn()} currentPath="/" />)
    const root = document.getElementById('mobile-nav')
    expect(root).toHaveAttribute('inert')
    expect(root).toHaveAttribute('data-open', 'false')
  })
})
