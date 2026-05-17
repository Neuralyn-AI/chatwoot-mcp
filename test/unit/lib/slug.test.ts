import { describe, it, expect } from 'vitest'
import { normalizeName, slugify } from '../../../src/lib/slug'

describe('slug helpers', () => {
  it('slugifies basic strings', () => {
    expect(slugify('Getting Started!')).toBe('getting-started')
    expect(slugify('Café Olé')).toBe('cafe-ole')
    expect(slugify(' Multi  Space ')).toBe('multi-space')
  })

  it('normalizeName lowercases and strips diacritics/punctuation for fuzzy match', () => {
    expect(normalizeName('First Steps!')).toBe('first steps')
    expect(normalizeName('  ÄppleTalk  ')).toBe('appletalk')
  })
})
