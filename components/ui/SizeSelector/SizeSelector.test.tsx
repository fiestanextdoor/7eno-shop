import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import SizeSelector, { type SizeOption } from './SizeSelector'

const SIZES: SizeOption[] = [
  { value: 's', label: 'S', soldOut: false },
  { value: 'm', label: 'M', soldOut: false },
  { value: 'l', label: 'L', soldOut: true },
  { value: 'xl', label: 'XL', soldOut: false },
]

function Controlled({
  initial = null,
  onChange = () => {},
}: {
  initial?: string | null
  onChange?: (value: string) => void
}) {
  const [value, setValue] = useState<string | null>(initial)
  return (
    <SizeSelector
      sizes={SIZES}
      value={value}
      onChange={(v) => {
        setValue(v)
        onChange(v)
      }}
    />
  )
}

const radio = (name: string) => screen.getByRole('radio', { name })

describe('SizeSelector', () => {
  it('is a labelled radio group with the sizes as text', () => {
    render(<Controlled />)
    const group = screen.getByRole('radiogroup', { name: 'Size' })
    expect(within(group).getAllByRole('radio').map((r) => r.textContent)).toEqual(['S', 'M', 'L (sold out)', 'XL'])
  })

  it('has one tab stop: the checked size, or the first when none is checked', () => {
    const { unmount } = render(<Controlled />)
    expect(screen.getAllByRole('radio').map((r) => r.tabIndex)).toEqual([0, -1, -1, -1])
    unmount()
    render(<Controlled initial="xl" />)
    expect(screen.getAllByRole('radio').map((r) => r.tabIndex)).toEqual([-1, -1, -1, 0])
  })

  it('selects a sold-out size too, struck through', () => {
    const onChange = jest.fn()
    render(<Controlled onChange={onChange} />)
    const l = radio('L (sold out)')
    expect(l).toHaveAttribute('data-sold-out', 'true')
    fireEvent.click(l)
    expect(onChange).toHaveBeenCalledWith('l')
    expect(l).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('L, sold out')).toBeInTheDocument()
  })

  it('moves and selects with the arrow keys, wrapping at both ends', () => {
    render(<Controlled initial="s" />)
    fireEvent.keyDown(radio('S'), { key: 'ArrowRight' })
    expect(radio('M')).toHaveAttribute('aria-checked', 'true')
    expect(radio('M')).toHaveFocus()
    fireEvent.keyDown(radio('M'), { key: 'ArrowUp' })
    expect(radio('S')).toHaveFocus()
    fireEvent.keyDown(radio('S'), { key: 'ArrowLeft' })
    expect(radio('XL')).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(radio('XL'), { key: 'ArrowDown' })
    expect(radio('S')).toHaveAttribute('aria-checked', 'true')
  })

  it('jumps with Home and End and ignores other keys', () => {
    render(<Controlled initial="m" />)
    fireEvent.keyDown(radio('M'), { key: 'End' })
    expect(radio('XL')).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(radio('XL'), { key: 'Home' })
    expect(radio('S')).toHaveAttribute('aria-checked', 'true')
    fireEvent.keyDown(radio('S'), { key: 'a' })
    expect(radio('S')).toHaveAttribute('aria-checked', 'true')
  })

  it('renders nothing without sizes', () => {
    const { container } = render(<SizeSelector sizes={[]} value={null} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('takes a custom label, an id and an aside', () => {
    render(
      <SizeSelector
        sizes={SIZES}
        value={null}
        onChange={() => {}}
        label="Colour"
        id="colours"
        aside={<a href="#guide">Size guide</a>}
      />
    )
    expect(screen.getByRole('radiogroup', { name: 'Colour' })).toHaveAttribute('id', 'colours')
    expect(screen.getByRole('link', { name: 'Size guide' })).toBeInTheDocument()
  })
})
