import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ChatwootClient } from '../../chatwoot/client'
import { listPortalsTool } from './list-portals'
import { createPortalTool } from './create-portal'
import { getPortalLocalesTool } from './get-portal-locales'
import { getPortalLogoTool } from './get-portal-logo'
import { uploadPortalLogoTool } from './upload-portal-logo'
import { removePortalLogoTool } from './remove-portal-logo'
import { listCategoriesTool } from './list-categories'
import { createCategoryTool } from './create-category'
import { addPortalLocaleTool } from './add-portal-locale'
import { findUntranslatedCategoriesTool } from './find-untranslated-categories'
import { findUntranslatedArticlesTool } from './find-untranslated-articles'
import { suggestCategoryAssociationsTool } from './suggest-category-associations'
import { associateCategoriesTool } from './associate-categories'
import { listArticlesTool } from './list-articles'
import { getArticleTool } from './get-article'
import { createArticleTool } from './create-article'

export interface ToolContext {
  chatwoot: ChatwootClient
}

export interface ToolDefinition {
  register(server: McpServer, ctx: ToolContext): void
}

export {
  listPortalsTool,
  createPortalTool,
  getPortalLocalesTool,
  getPortalLogoTool,
  uploadPortalLogoTool,
  removePortalLogoTool,
  listCategoriesTool,
  createCategoryTool,
  addPortalLocaleTool,
  findUntranslatedCategoriesTool,
  findUntranslatedArticlesTool,
  suggestCategoryAssociationsTool,
  associateCategoriesTool,
  listArticlesTool,
  getArticleTool,
  createArticleTool,
}

export const tools: ToolDefinition[] = [
  listPortalsTool,
  createPortalTool,
  getPortalLocalesTool,
  getPortalLogoTool,
  uploadPortalLogoTool,
  removePortalLogoTool,
  listCategoriesTool,
  createCategoryTool,
  addPortalLocaleTool,
  findUntranslatedCategoriesTool,
  findUntranslatedArticlesTool,
  suggestCategoryAssociationsTool,
  associateCategoriesTool,
  listArticlesTool,
  getArticleTool,
  createArticleTool,
]
