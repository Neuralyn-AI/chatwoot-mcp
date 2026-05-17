export type Locale = string

const LOCALE_RE = /^[a-z]{2,3}([_-][A-Za-z0-9]+)?$/

export function isValidLocale(s: string): boolean {
  return LOCALE_RE.test(s)
}

export function missing(universe: Locale[], subset: Locale[]): Locale[] {
  const present = new Set(subset)
  return universe.filter((l) => !present.has(l))
}
