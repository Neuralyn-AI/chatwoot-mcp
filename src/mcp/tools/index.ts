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
]
