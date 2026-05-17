import { describe, it, expect } from 'vitest'
import { isValidLocale, missing } from '../../../src/lib/locale'

describe('locale helpers', () => {
  it('accepts BCP47-ish locales', () => {
    expect(isValidLocale('en')).toBe(true)
    expect(isValidLocale('pt_BR')).toBe(true)
    expect(isValidLocale('es-419')).toBe(true)
    expect(isValidLocale('not a locale')).toBe(false)
  })

  it('missing returns locales present in the universe but not in the subset', () => {
    expect(missing(['en', 'pt_BR', 'es'], ['en'])).toEqual(['pt_BR', 'es'])
  })
})
