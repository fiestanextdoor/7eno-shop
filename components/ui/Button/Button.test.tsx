import { render, screen, fireEvent } from '@testing-library/react'
import Button, { buttonClasses } from './Button'

describe('Button', () => {
  it('is a plain button by default, so it never submits a form by accident', () => {
    render(<Button>Shop the drop</Button>)
    const button = screen.getByRole('button', { name: 'Shop the drop' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('button', 'primary', 'md')
  })

  it('applies the variant and size classes', () => {
    render(<Button variant="accent" size="lg">Notify me</Button>)
    expect(screen.getByRole('button', { name: 'Notify me' })).toHaveClass('accent', 'lg')
  })

  it('is disabled and busy while loading, and ignores clicks', () => {
    const onClick = jest.fn()
    render(<Button loading onClick={onClick}>Notify me</Button>)
    const button = screen.getByRole('button', { name: 'Notify me' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('passes clicks through when idle', () => {
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Go</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('exposes the same classes for links styled as buttons', () => {
    expect(buttonClasses('ghost', 'lg')).toBe('button ghost lg')
    expect(buttonClasses()).toBe('button primary md')
  })
})
