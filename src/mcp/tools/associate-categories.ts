import { z } from 'zod'
import { defineTool } from './define'
import {
  listCategories,
  createCategory,
  deleteCategory,
  updateCategory,
} from '../../chatwoot/categories'
import { listArticles, updateArticle } from '../../chatwoot/articles'

// ADR 0003: PATCH on /categories/{id} with a new slug is accepted and the
// article-category links are preserved through the rename. The fallback
// strategies remain in this file for forward-compatibility with future
// Chatwoot versions that may reject slug PATCHes.
const STRATEGY: 'patch' | 'delete-recreate' | 'move-delete-recreate' = 'patch'

interface AssociateResult {
  locale: string
  slug: string
  articles_moved: number
  strategy: typeof STRATEGY
}

export const associateCategoriesTool = defineTool({
  name: 'chatwoot_associate_categories',
  description:
    'Align category slugs across locales so they all share target_slug. Per-source, either PATCHes the existing category or recreates it depending on what the Chatwoot API allows (see ADR 0003).',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    target_slug: z.string().min(1),
    sources: z
      .array(z.object({ locale: z.string().min(1), current_slug: z.string().min(1) }))
      .min(1),
  }),
  async run(ctx, { portal_slug, target_slug, sources }) {
    const out: AssociateResult[] = []

    for (const source of sources) {
      if (source.current_slug === target_slug) {
        out.push({
          locale: source.locale,
          slug: target_slug,
          articles_moved: 0,
          strategy: STRATEGY,
        })
        continue
      }

      const cats = await listCategories(ctx.chatwoot, portal_slug, source.locale)
      const cat = cats.find((c) => c.slug === source.current_slug)
      if (!cat) {
        throw new Error(
          `Category '${source.current_slug}' not found in locale ${source.locale}`,
        )
      }

      const articles = await listArticles(ctx.chatwoot, {
        portal_slug,
        locale: source.locale,
        category_slug: source.current_slug,
      })

      if (STRATEGY === 'patch') {
        await updateCategory(ctx.chatwoot, portal_slug, cat.id, { slug: target_slug })
      } else if (STRATEGY === 'delete-recreate') {
        await deleteCategory(ctx.chatwoot, portal_slug, cat.id)
        const recreated = await createCategory(ctx.chatwoot, portal_slug, {
          slug: target_slug,
          name: cat.name,
          description: cat.description,
          locale: source.locale,
          position: cat.position,
          parent_category_id: cat.parent_category_id ?? undefined,
        })
        for (const a of articles) {
          await updateArticle(ctx.chatwoot, portal_slug, a.id, { category_id: recreated.id })
        }
      } else {
        const placeholder = await createCategory(ctx.chatwoot, portal_slug, {
          slug: `${target_slug}-tmp-${cat.id}`,
          name: `${cat.name} (tmp)`,
          locale: source.locale,
        })
        for (const a of articles) {
          await updateArticle(ctx.chatwoot, portal_slug, a.id, { category_id: placeholder.id })
        }
        await deleteCategory(ctx.chatwoot, portal_slug, cat.id)
        const recreated = await createCategory(ctx.chatwoot, portal_slug, {
          slug: target_slug,
          name: cat.name,
          description: cat.description,
          locale: source.locale,
          position: cat.position,
          parent_category_id: cat.parent_category_id ?? undefined,
        })
        for (const a of articles) {
          await updateArticle(ctx.chatwoot, portal_slug, a.id, { category_id: recreated.id })
        }
        await deleteCategory(ctx.chatwoot, portal_slug, placeholder.id)
      }

      out.push({
        locale: source.locale,
        slug: target_slug,
        articles_moved: articles.length,
        strategy: STRATEGY,
      })
    }

    return { associated: out }
  },
})
