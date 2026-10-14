import { fireEvent, render, screen, within } from '@testing-library/react'
import type { SizeGuide } from '@/lib/printful'
import SizeGuideDialog, { type SizeGuideDialogProps } from './SizeGuideDialog'

const GUIDE: SizeGuide = {
  unit: 'cm',
  sizes: ['S', 'M', 'L'],
  rows: [
    { label: 'Chest', values: { S: '104', M: '110', L: '116' } },
    { label: 'Length', values: { S: '70', M: '72' } },
  ],
}

function setup(props: Partial<SizeGuideDialogProps> = {}) {
  render(<SizeGuideDialog category="Hoodies" guide={GUIDE} {...props} />)
  const trigger = screen.getByRole('button', { name: 'Size guide' })
  const dialog = document.querySelector('dialog') as HTMLDialogElement
  return { trigger, dialog }
}

type DialogProto = { showModal?: unknown; close?: unknown }

describe('SizeGuideDialog', () => {
  it('starts closed and opens as a labelled dialog with the size table', () => {
    const { trigger, dialog } = setup()
    expect(dialog).not.toHaveAttribute('open')
    fireEvent.click(trigger)
    expect(dialog).toHaveAttribute('open')
    const d = screen.getByRole('dialog', { name: 'Hoodies size guide' })
    expect(within(d).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Size', 'S', 'M', 'L'])
    expect(within(d).getByRole('row', { name: /Length/ })).toHaveTextContent('Length7072-')
    expect(within(d).getByText('Body measurements in cm')).toBeInTheDocument()
  })

  it('closes with the close button and returns focus to the trigger', () => {
    const { trigger, dialog } = setup()
    fireEvent.click(trigger)
    fireEvent.click(screen.getByRole('button', { name: 'Close size guide' }))
    expect(dialog).not.toHaveAttribute('open')
    expect(trigger).toHaveFocus()
  })

  it('closes on Escape, as a cancel event and as a key press', () => {
    const { trigger, dialog } = setup()
    fireEvent.click(trigger)
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    expect(dialog).not.toHaveAttribute('open')
    expect(trigger).toHaveFocus()
    fireEvent.click(trigger)
    fireEvent.keyDown(dialog, { key: 'Escape' })
    expect(dialog).not.toHaveAttribute('open')
  })

  it('closes on a backdrop click, not on a click inside', () => {
    const { trigger, dialog } = setup()
    fireEvent.click(trigger)
    fireEvent.click(screen.getByText('Chest'))
    expect(dialog).toHaveAttribute('open')
    fireEvent.click(dialog)
    expect(dialog).not.toHaveAttribute('open')
  })

  it('uses the native modal API when the browser has it', () => {
    const proto = HTMLDialogElement.prototype as unknown as DialogProto
    const showModal = jest.fn(function (this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    const close = jest.fn(function (this: HTMLDialogElement) {
      this.removeAttribute('open')
    })
    proto.showModal = showModal
    proto.close = close
    try {
      const { trigger } = setup()
      fireEvent.click(trigger)
      expect(showModal).toHaveBeenCalledTimes(1)
      fireEvent.click(screen.getByRole('button', { name: 'Close size guide' }))
      expect(close).toHaveBeenCalledTimes(1)
    } finally {
      delete proto.showModal
      delete proto.close
    }
  })

  it('shows the model note and display labels such as EU sizes', () => {
    const { trigger } = setup({ modelNote: 'Model is 1,85 m and wears L', sizeLabels: { S: 'EU 40' } })
    fireEvent.click(trigger)
    const d = screen.getByRole('dialog', { name: 'Hoodies size guide' })
    expect(within(d).getByRole('columnheader', { name: 'EU 40' })).toBeInTheDocument()
    expect(within(d).getByText('Model is 1,85 m and wears L')).toBeInTheDocument()
  })
})
