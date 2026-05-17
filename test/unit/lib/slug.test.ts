import { describe, it, expect } from 'vitest'
import { normalizeName, slugify } from '../../../src/lib/slug'

describe('slug helpers', () => {
  it('slugifies basic strings', () => {
    expect(slugify('Getting Started!')).toBe('getting-started')
    expect(slugify('Olá Mundo')).toBe('ola-mundo')
    expect(slugify(' Multi  Space ')).toBe('multi-space')
  })

  it('normalizeName lowercases and strips diacritics/punctuation for fuzzy match', () => {
    expect(normalizeName('Primeiros passos!')).toBe('primeiros passos')
    expect(normalizeName('  ÄppleTalk  ')).toBe('appletalk')
  })
})
