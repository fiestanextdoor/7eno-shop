import { render, screen } from '@testing-library/react'
import FaqPage from './page'

describe('FAQ', () => {
  it('answers in accordions, one details element per question', () => {
    render(<FaqPage />)
    const question = screen.getByText('Which payment methods can I use?')
    expect(question.closest('summary')).not.toBeNull()
    expect(question.closest('details')).not.toBeNull()
  })

  it('keeps every structured-data answer visible on the page', () => {
    const { container } = render(<FaqPage />)
    const scripts = [...container.querySelectorAll('script[type="application/ld+json"]')]
    const faq = scripts.map((s) => JSON.parse(s.textContent ?? '{}')).find((d) => d['@type'] === 'FAQPage')
    expect(faq.mainEntity.length).toBeGreaterThan(5)
    for (const entry of faq.mainEntity) {
      expect(screen.getByText(entry.acceptedAnswer.text)).toBeInTheDocument()
    }
  })

  it('explains the two editions and never mentions OG', () => {
    const { container } = render(<FaqPage />)
    expect(screen.getByText('What is the difference between Olympian and OLYMPN Sport?')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/\bOG\b/)
    expect(container.textContent).not.toMatch(/[–—]/)
  })
})
