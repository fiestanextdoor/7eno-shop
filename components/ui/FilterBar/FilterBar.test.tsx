import type { ReactNode } from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import FilterBar from './FilterBar'
import type { FilterGroup } from '@/lib/filter-types'
import type { SortOption } from '@/lib/shop-query'

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }))

// next/link navigates through the mounted app router, which a unit test does
// not have. A plain anchor that cancels the navigation is enough to test our
// own click handlers.
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

const push = jest.fn()

const FILTERS: FilterGroup[] = [
  {
    label: 'Collection',
    items: [
      { label: 'All', href: '/shop?category=hoodies', active: false },
      { label: 'OLYMPN Sport', href: '/shop?collection=olympn-sport&category=hoodies', active: true },
      { label: 'Olympian', href: '/shop?collection=olympian&category=hoodies', active: false },
    ],
  },
  {
    label: 'Category',
    items: [
      { label: 'All', href: '/shop?collection=olympn-sport', active: false },
      { label: 'Hoodies', href: '/shop?collection=olympn-sport&category=hoodies', active: true },
    ],
  },
]

const SORT_OPTIONS: SortOption[] = [
  { value: 'featured', label: 'Featured', href: '/shop?collection=olympn-sport&category=hoodies' },
  { value: 'price-asc', label: 'Price, low to high', href: '/shop?collection=olympn-sport&category=hoodies&sort=price-asc' },
]

beforeEach(() => {
  push.mockReset()
  jest.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>)
})

describe('FilterBar', () => {
  it('shows every filter as a chip link and marks the active ones', () => {
    render(<FilterBar filters={FILTERS} sort="featured" sortOptions={SORT_OPTIONS} />)
    const bar = screen.getByRole('navigation', { name: 'Filters' })
    const sport = within(bar).getByRole('link', { name: 'OLYMPN Sport' })
    expect(sport).toHaveAttribute('href', '/shop?collection=olympn-sport&category=hoodies')
    expect(sport).toHaveAttribute('aria-current', 'true')
    expect(within(bar).getByRole('link', { name: 'Olympian' })).not.toHaveAttribute('aria-current')
  })

  it('navigates when the sort changes, without jumping to the top', () => {
    render(<FilterBar filters={FILTERS} sort="featured" sortOptions={SORT_OPTIONS} />)
    const [select] = screen.getAllByRole('combobox', { name: 'Sort' })
    fireEvent.change(select, { target: { value: 'price-asc' } })
    expect(push).toHaveBeenCalledWith('/shop?collection=olympn-sport&category=hoodies&sort=price-asc', { scroll: false })
  })

  it('opens a filter drawer that shows the active count and closes after a choice', () => {
    render(<FilterBar filters={FILTERS} sort="featured" sortOptions={SORT_OPTIONS} resultCount={4} />)
    fireEvent.click(screen.getByRole('button', { name: 'Filters (2)' }))
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(dialog.closest('[data-open]')).toHaveAttribute('data-open', 'true')
    expect(within(dialog).getByRole('button', { name: 'Show 4 results' })).toBeInTheDocument()
    fireEvent.click(within(dialog).getByRole('link', { name: 'Olympian' }))
    expect(dialog.closest('[data-open]')).toHaveAttribute('data-open', 'false')
  })

  it('renders the drawer outside the sticky bar, so the chrome cannot cover it', () => {
    render(<FilterBar filters={FILTERS} sort="featured" sortOptions={SORT_OPTIONS} />)
    const bar = screen.getByRole('button', { name: 'Filters (2)' }).parentElement?.parentElement
    const drawer = screen.getByRole('dialog', { hidden: true }).closest('[data-open]')
    expect(bar).toBeTruthy()
    expect(bar?.contains(drawer)).toBe(false)
  })

  it('renders only the extra controls when there are no filters or sorts', () => {
    render(<FilterBar filters={[]} sort="featured" controls={<button type="button">density</button>} />)
    expect(screen.getByRole('button', { name: 'density' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Filters/ })).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
