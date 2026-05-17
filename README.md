# chatwoot-mcp

> ChatWoot MCP Server for Cloudflare Workers. Integrate ChatWoot with Claude Code or your custom AI Agent.

Single-tenant MCP server that exposes Chatwoot Help Center tools (portals, categories, articles, cross-locale operations) over Streamable HTTP.

## Deploy

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Neuralyn/chatwoot-mcp)

You will be prompted for:

| Secret | What it is |
|---|---|
| `CHATWOOT_BASE_URL` | Base URL of your Chatwoot instance, e.g. `https://chat.example.com`. Use `https://app.chatwoot.com` for Chatwoot Cloud. |
| `CHATWOOT_API_TOKEN` | API access token of an agent/administrator (Profile → Access Tokens). |
| `CHATWOOT_ACCOUNT_ID` | Numeric account ID (visible in the URL after `/app/accounts/`). |
| `MCP_AUTH_TOKEN` | Bearer token that MCP clients (e.g. Claude Code) will send. Generate a strong random value. |

After deploy, verify health:

```
curl https://chatwoot-mcp.<subdomain>.workers.dev/healthz
```

Expected: `{"status":"ok","portals_visible":N}`.

## Use with Claude Code

### Worker deployed

```
claude mcp add --transport http chatwoot \
  https://chatwoot-mcp.<subdomain>.workers.dev/mcp \
  --header "Authorization: Bearer <MCP_AUTH_TOKEN>"
```

### Local dev

```
pnpm install
cp .dev.vars.example .dev.vars   # edit values
pnpm dev                          # wrangler dev on :8787

claude mcp add --transport http chatwoot \
  http://localhost:8787/mcp \
  --header "Authorization: Bearer <MCP_AUTH_TOKEN>"
```

## Tools

| Tool | Purpose |
|---|---|
| `chatwoot_list_portals` | List all Help Center portals. |
| `chatwoot_create_portal` | Create a new portal. |
| `chatwoot_get_portal_locales` | Show allowed and default locales of a portal. |
| `chatwoot_get_portal_logo` | Read the portal logo URL. |
| `chatwoot_upload_portal_logo` | Download an image URL and set it as the portal logo. |
| `chatwoot_remove_portal_logo` | Remove the portal logo. |
| `chatwoot_add_portal_locale` | Add a locale and backfill missing categories. |
| `chatwoot_create_category` | Create a category in every allowed locale. |
| `chatwoot_list_categories` | List categories of a portal for a locale. |
| `chatwoot_find_untranslated_categories` | Categories missing in some locales. |
| `chatwoot_find_untranslated_articles` | Articles missing translations in some locales. |
| `chatwoot_suggest_category_associations` | Propose cross-locale slug alignment candidates. |
| `chatwoot_associate_categories` | Apply a confirmed slug alignment. |

## Development

```
pnpm install
pnpm dev               # wrangler dev
pnpm test              # unit tests
pnpm test:integration  # against real Chatwoot (requires .dev.vars)
pnpm typecheck
```

## Architecture decision records

See `docs/adr/` for investigation outcomes (logo upload, translation key, category rename strategy, public search).

## Roadmap

- `chatwoot_search_articles` — wrap the public `/hc/{portal}/{locale}/articles.json` search endpoint mapped in ADR 0004.

## License

MIT — see `LICENSE`.
