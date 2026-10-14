import { render, screen, fireEvent } from '@testing-library/react'
import Drawer from './Drawer'

function renderDrawer(open: boolean, onClose = jest.fn()) {
  render(
    <Drawer open={open} onClose={onClose} side="left" title="Filters" footer={<button type="button">Show 4 results</button>}>
      <a href="#tees">Tees</a>
    </Drawer>
  )
  return onClose
}

describe('Drawer', () => {
  it('is a labelled modal dialog', () => {
    renderDrawer(true)
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('focuses the close button first when opened', () => {
    renderDrawer(true)
    expect(screen.getByRole('button', { name: 'Close filters' })).toHaveFocus()
  })

  it('closes on Escape, on the close button and on the backdrop', () => {
    const onClose = renderDrawer(true)
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close filters' }))
    fireEvent.click(screen.getByTestId('drawer-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('keeps Tab inside the panel', () => {
    renderDrawer(true)
    screen.getByRole('button', { name: 'Show 4 results' }).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByRole('button', { name: 'Close filters' })).toHaveFocus()
  })

  it('is inert and out of the accessibility tree when closed', () => {
    const { container } = render(
      <Drawer open={false} onClose={jest.fn()} side="right" title="Cart">
        <p>Empty</p>
      </Drawer>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('inert')
    expect(root).toHaveAttribute('data-open', 'false')
    expect(root).toHaveAttribute('data-side', 'right')
  })
})
