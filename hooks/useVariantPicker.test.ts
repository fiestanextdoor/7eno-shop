import { renderHook, act } from '@testing-library/react'
import { useVariantPicker, HIDDEN_SIZES, type PickableVariant } from './useVariantPicker'

const v = (id: string, color: string, size: string, inStock = true, name = `${size} / ${color}`): PickableVariant =>
  ({ id, color, size, name, inStock })

const variants = [
  v('b-s', 'Black', 'S'),
  v('b-m', 'Black', 'M', false),
  v('b-4xl', 'Black', '4XL'),
  v('b-5xl', 'Black', '5X-Large'),
  v('r-s', 'Maroon', 'S'),
  v('r-m', 'Maroon', 'M'),
]

describe('useVariantPicker', () => {
  it('starts on the first colour and lists only its sizes', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    expect(result.current.hasColors).toBe(true)
    expect(result.current.selectedColor).toBe('Black')
    expect(result.current.sizes.map((s) => s.id)).toEqual(['b-s', 'b-m'])
  })

  it('removes the hidden sizes', () => {
    expect([...HIDDEN_SIZES]).toEqual(['4XL', '5XL', '6XL', '7XL', '8XL', '4X-Large', '5X-Large'])
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    expect(result.current.sizes.some((s) => HIDDEN_SIZES.has(s.size))).toBe(false)
  })

  it('keeps sold-out sizes in sizes but not in availableSizes', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    const m = result.current.sizes.find((s) => s.id === 'b-m')!
    expect(result.current.isAvailable(m)).toBe(false)
    expect(result.current.availableSizes.map((s) => s.id)).toEqual(['b-s'])
  })

  it('treats every size as available when the whole colour is sold out (pre-sale)', () => {
    const soldOut = [v('a', 'Black', 'S', false), v('b', 'Black', 'M', false)]
    const { result } = renderHook(() => useVariantPicker({ variants: soldOut, colors: ['Black'] }))
    expect(result.current.availableSizes.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('switches colour and clears the selected variant', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black', 'Maroon'] }))
    act(() => result.current.selectVariant('b-s'))
    expect(result.current.selectedVariant?.id).toBe('b-s')
    act(() => result.current.selectColor('Maroon'))
    expect(result.current.selectedColor).toBe('Maroon')
    expect(result.current.selectedVariantId).toBeNull()
    expect(result.current.selectedVariant).toBeNull()
    expect(result.current.sizes.map((s) => s.id)).toEqual(['r-s', 'r-m'])
  })

  it('ignores colour filtering for a single-colour product', () => {
    const { result } = renderHook(() => useVariantPicker({ variants, colors: ['Black'] }))
    expect(result.current.hasColors).toBe(false)
    expect(result.current.colorVariants).toHaveLength(variants.length)
  })

  it('dedupes by size and falls back to the variant name when size is empty', () => {
    const dupes = [v('1', '', 'M'), v('2', '', 'M'), v('3', '', '', true, 'One size')]
    const { result } = renderHook(() => useVariantPicker({ variants: dupes, colors: [] }))
    expect(result.current.sizes.map((s) => s.id)).toEqual(['2', '3'])
  })

  it('honours initialColor and returns null for an unknown variant id', () => {
    const { result } = renderHook(() =>
      useVariantPicker({ variants, colors: ['Black', 'Maroon'], initialColor: 'Maroon' })
    )
    expect(result.current.selectedColor).toBe('Maroon')
    act(() => result.current.selectVariant('does-not-exist'))
    expect(result.current.selectedVariant).toBeNull()
  })

  it('survives a product without variants', () => {
    const { result } = renderHook(() => useVariantPicker({ variants: [], colors: [] }))
    expect(result.current.selectedColor).toBe('')
    expect(result.current.sizes).toEqual([])
    expect(result.current.availableSizes).toEqual([])
  })
})
