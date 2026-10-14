import { render, screen } from '@testing-library/react'
import Accordion from './Accordion'

describe('Accordion', () => {
  it('renders one details element per item with its summary and content', () => {
    const { container } = render(
      <Accordion
        items={[
          { title: 'Details', content: <p>Heavyweight cotton</p> },
          { title: 'Fit', content: 'Oversized fit' },
        ]}
        defaultOpen={0}
      />
    )
    const details = container.querySelectorAll('details')
    expect(details).toHaveLength(2)
    expect(details[0]).toHaveAttribute('open')
    expect(details[1]).not.toHaveAttribute('open')
    expect(screen.getByText('Details').closest('summary')).not.toBeNull()
    expect(details[0]).toContainElement(screen.getByText('Heavyweight cotton'))
    expect(details[1]).toHaveTextContent('Oversized fit')
  })

  it('starts fully closed without defaultOpen', () => {
    const { container } = render(<Accordion items={[{ title: 'Fit', content: 'x' }]} />)
    expect(container.querySelector('details')).not.toHaveAttribute('open')
  })

  it('renders nothing without items', () => {
    const { container } = render(<Accordion items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
