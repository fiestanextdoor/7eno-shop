import { render, screen, fireEvent } from '@testing-library/react'
import GridDensityToggle from './GridDensityToggle'

describe('GridDensityToggle', () => {
  it('is a labelled radio group with the current value checked', () => {
    render(<GridDensityToggle value={4} options={[2, 4]} onChange={jest.fn()} />)
    expect(screen.getByRole('radiogroup', { name: 'Products per row' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '4 per row' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '2 per row' })).toHaveAttribute('aria-checked', 'false')
  })

  it('reports a click', () => {
    const onChange = jest.fn()
    render(<GridDensityToggle value={4} options={[2, 4]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: '2 per row' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('moves the choice and focus with the arrow keys, wrapping around', () => {
    const onChange = jest.fn()
    render(<GridDensityToggle value={4} options={[2, 4]} onChange={onChange} />)
    const four = screen.getByRole('radio', { name: '4 per row' })
    four.focus()
    fireEvent.keyDown(four, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(2)
    expect(screen.getByRole('radio', { name: '2 per row' })).toHaveFocus()
  })

  it('has exactly one tab stop, on the checked option', () => {
    render(<GridDensityToggle value={2} options={[1, 2]} onChange={jest.fn()} label="Products per row (mobile)" />)
    expect(screen.getByRole('radio', { name: '2 per row' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: '1 per row' })).toHaveAttribute('tabindex', '-1')
  })

  it('keeps the first option reachable when the value is not an option', () => {
    render(<GridDensityToggle value={4} options={[1, 2]} onChange={jest.fn()} />)
    expect(screen.getByRole('radio', { name: '1 per row' })).toHaveAttribute('tabindex', '0')
  })
})
