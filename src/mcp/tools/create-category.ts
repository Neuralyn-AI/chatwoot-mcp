import { z } from 'zod'
import { defineTool } from './define'
import { getPortal, toPortalSummary } from '../../chatwoot/portals'
import { createCategory } from '../../chatwoot/categories'
import { pLimit } from '../../lib/concurrency'

export const createCategoryTool = defineTool({
  name: 'chatwoot_create_category',
  description:
    'Create a category in every allowed locale of a portal. Locales not present in names_by_locale fall back to the default locale name.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    slug: z.string().min(1),
    names_by_locale: z.record(z.string(), z.string().min(1)),
    descriptions_by_locale: z.record(z.string(), z.string()).optional(),
    position: z.number().optional(),
    parent_category_id: z.number().nullable().optional(),
  }),
  async run(ctx, input) {
    const portalRaw = await getPortal(ctx.chatwoot, input.portal_slug)
    const portal = toPortalSummary(portalRaw)
    if (!portal.allowed_locales.length) {
      throw new Error(`Portal ${input.portal_slug} has no allowed locales`)
    }

    const fallbackName =
      input.names_by_locale[portal.default_locale] ??
      Object.values(input.names_by_locale)[0]
    if (!fallbackName) throw new Error('names_by_locale must contain at least one entry')

    const limit = pLimit(4)
    const created = await Promise.all(
      portal.allowed_locales.map((locale) =>
        limit(async () => {
          const name = input.names_by_locale[locale] ?? fallbackName
          const description = input.descriptions_by_locale?.[locale]
          try {
            const raw = await createCategory(ctx.chatwoot, input.portal_slug, {
              slug: input.slug,
              name,
              locale,
              description,
              position: input.position,
              parent_category_id: input.parent_category_id ?? undefined,
            })
            return {
              id: raw.id,
              slug: raw.slug,
              locale: raw.locale,
              name: raw.name,
            } as {
              id: number
              slug: string
              locale: string
              name: string
              error?: string
            }
          } catch (err) {
            return {
              id: 0,
              slug: input.slug,
              locale,
              name,
              error: (err as Error).message,
            }
          }
        }),
      ),
    )

    return { created }
  },
})
