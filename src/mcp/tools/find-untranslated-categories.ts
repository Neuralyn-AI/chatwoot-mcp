import { z } from 'zod'
import { defineTool } from './define'
import { getPortal, toPortalSummary } from '../../chatwoot/portals'
import { listCategories } from '../../chatwoot/categories'
import { missing as missingLocales } from '../../lib/locale'

export const findUntranslatedCategoriesTool = defineTool({
  name: 'chatwoot_find_untranslated_categories',
  description:
    'List categories whose slug does not appear in every allowed locale of the portal.',
  inputSchema: z.object({ portal_slug: z.string().min(1) }),
  async run(ctx, { portal_slug }) {
    const portal = toPortalSummary(await getPortal(ctx.chatwoot, portal_slug))
    const byLocale = await Promise.all(
      portal.allowed_locales.map(async (locale) => ({
        locale,
        cats: await listCategories(ctx.chatwoot, portal_slug, locale).catch(() => []),
      })),
    )

    type Acc = { present_in: Set<string>; sample_name: string }
    const bySlug = new Map<string, Acc>()
    for (const { locale, cats } of byLocale) {
      for (const c of cats) {
        const existing = bySlug.get(c.slug)
        if (existing) existing.present_in.add(locale)
        else bySlug.set(c.slug, { present_in: new Set([locale]), sample_name: c.name })
      }
    }

    const groups = Array.from(bySlug.entries())
      .map(([slug, acc]) => ({
        slug,
        sample_name: acc.sample_name,
        present_in: Array.from(acc.present_in),
        missing_in: missingLocales(portal.allowed_locales, Array.from(acc.present_in)),
      }))
      .filter((g) => g.missing_in.length > 0)

    return { groups }
  },
})
