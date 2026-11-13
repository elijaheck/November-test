/**
 * The product this build ships as. The fork keeps the upstream workspace and
 * runtime, and narrows what it offers to a people-and-agents mail client and
 * browser: no infrastructure consoles at the entry points.
 *
 * User-visible copy is literal (i18n extracts source strings), so a rename is a
 * find-and-replace of PRODUCT_NAME's value across src/, electron/ and the
 * locales, plus `build.productName` in package.json.
 */
export const PRODUCT_NAME = 'OpenBot'

/** Connector categories offered in the catalog and sidebar. Infra, observability, databases, networking and compliance are hidden. */
export const OFFERED_CONNECTOR_CATEGORIES: ReadonlySet<string> = new Set([
  'source-control',
  'project-management',
  'document',
  'email',
  'messaging',
])

/** Workspace pages not offered from New Tab or the command palette. Routes still resolve so old links don't break. */
export const HIDDEN_WORKSPACE_KEYS: ReadonlySet<string> = new Set([
  'team.architecture',
  'team.designs',
  'team.monitoring',
])

export function isOfferedWorkspaceKey(key: string): boolean {
  return !HIDDEN_WORKSPACE_KEYS.has(key)
}

export function isOfferedConnectorCategory(id: string): boolean {
  return OFFERED_CONNECTOR_CATEGORIES.has(id)
}
