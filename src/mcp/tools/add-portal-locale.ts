import { z } from 'zod'
import { defineTool } from './define'
import { getPortal, toPortalSummary, updatePortal } from '../../chatwoot/portals'
import { listCategories, createCategory } from '../../chatwoot/categories'
import { pLimit } from '../../lib/concurrency'
import { isValidLocale } from '../../lib/locale'

type Backfill = { slug: string; locale: string; source_category_id: number }

export const addPortalLocaleTool = defineTool({
  name: 'chatwoot_add_portal_locale',
  description:
    'Add a locale to a portal allowed_locales and backfill any categories that do not yet have a version in the new locale (copied from the default locale).',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    locale: z.string().refine(isValidLocale, 'invalid locale'),
  }),
  async run(ctx, { portal_slug, locale }) {
    const portalRaw = await getPortal(ctx.chatwoot, portal_slug)
    const portal = toPortalSummary(portalRaw)

    if (portal.allowed_locales.includes(locale)) {
      return { added_locale: locale, backfilled_categories: [] as Backfill[] }
    }

    const newAllowed = [...portal.allowed_locales, locale]
    await updatePortal(ctx.chatwoot, portal_slug, {
      config: { allowed_locales: newAllowed, default_locale: portal.default_locale },
    })

    const [defaultCats, newLocaleCats] = await Promise.all([
      listCategories(ctx.chatwoot, portal_slug, portal.default_locale),
      listCategories(ctx.chatwoot, portal_slug, locale).catch(() => []),
    ])

    const haveSlugs = new Set(newLocaleCats.map((c) => c.slug))
    const missing = defaultCats.filter((c) => !haveSlugs.has(c.slug))

    const limit = pLimit(4)
    const backfilled: Backfill[] = await Promise.all(
      missing.map((src) =>
        limit(async () => {
          await createCategory(ctx.chatwoot, portal_slug, {
            slug: src.slug,
            name: src.name,
            description: src.description,
            locale,
            position: src.position,
            parent_category_id: src.parent_category_id ?? undefined,
          })
          return { slug: src.slug, locale, source_category_id: src.id }
        }),
      ),
    )

    return { added_locale: locale, backfilled_categories: backfilled }
  },
})
