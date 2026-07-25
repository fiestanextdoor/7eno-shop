import { classify, olympianSortRank, HIDDEN_SIZES } from './product-classify'

// The real catalogue names, deliberately in the order the provider returns them
// (backpacks first) so the test proves the sort actually reorders.
const CATALOGUE = [
  'Olympian Ocean Backpack 20 L',
  'Olympian Coconut Backpack 20 L',
  'Olympian Sand Backpack 20 L',
  'Olympian Flamingo Backpack 20 L',
  'Olympian Tee Coconut Unisex',
  'Olympian Tee Flamingo Unisex',
  'Olympian Tee Sand Unisex',
  'Olympian Tee Ocean Unisex',
  'Olympian Knitted Tee Coconut Unisex',
  'Olympian Knitted Tee Flamingo Unisex',
  'Olympian Knitted Tee Sand Unisex',
  'Olympian Knitted Tee Ocean Unisex',
]

const sorted = () => [...CATALOGUE].sort((a, b) => olympianSortRank(a) - olympianSortRank(b))

describe('olympianSortRank', () => {
  it('groups knitted tees, then tees, then backpacks', () => {
    const groups = sorted().map((n) =>
      /knitted/i.test(n) ? 'knitted' : /backpack/i.test(n) ? 'backpack' : 'tee',
    )
    expect(groups).toEqual([
      'knitted', 'knitted', 'knitted', 'knitted',
      'tee', 'tee', 'tee', 'tee',
      'backpack', 'backpack', 'backpack', 'backpack',
    ])
  })

  it('repeats the same colourway sequence in every group', () => {
    const colour = (n: string) =>
      ['ocean', 'coconut', 'sand', 'flamingo'].find((c) => n.toLowerCase().includes(c))
    const rows = [sorted().slice(0, 4), sorted().slice(4, 8), sorted().slice(8, 12)]
    for (const row of rows) {
      expect(row.map(colour)).toEqual(['ocean', 'coconut', 'sand', 'flamingo'])
    }
  })

  it('lines the colourways up in columns on the 4-wide grid', () => {
    // Column n of a 4-column grid is every 4th item starting at n.
    const list = sorted()
    for (let col = 0; col < 4; col++) {
      const column = [list[col], list[col + 4], list[col + 8]]
      const colours = column.map((n) =>
        ['ocean', 'coconut', 'sand', 'flamingo'].find((c) => n.toLowerCase().includes(c)),
      )
      expect(new Set(colours).size).toBe(1)
    }
  })

  it('does not mistake a knitted tee for a plain tee', () => {
    expect(olympianSortRank('Olympian Knitted Tee Ocean Unisex'))
      .toBeLessThan(olympianSortRank('Olympian Tee Ocean Unisex'))
  })

  it('sorts an unknown colourway to the end of its own group, not the front', () => {
    const unknown = olympianSortRank('Olympian Tee Midnight Unisex')
    expect(unknown).toBeGreaterThan(olympianSortRank('Olympian Tee Flamingo Unisex'))
    expect(unknown).toBeLessThan(olympianSortRank('Olympian Ocean Backpack 20 L'))
  })
})

describe('classify', () => {
  it('separates the two collections', () => {
    expect(classify('Olympian Tee Ocean Unisex').isOlympian).toBe(true)
    expect(classify('7ENO Ink/Blood Tee Men').isOlympian).toBe(false)
  })
  it('hides the sizes the storefront hides', () => {
    expect(HIDDEN_SIZES.has('4XL')).toBe(true)
    expect(HIDDEN_SIZES.has('XL')).toBe(false)
  })
})
