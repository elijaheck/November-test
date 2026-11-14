/** What a script does to a page, for the approval card; null when it only reads. */
export type PageAction = 'submit' | 'send' | 'click' | 'type'

const RULES: [PageAction, RegExp][] = [
  ['submit', /\.(?:requestSubmit|submit)\s*\(/],
  ['send', /\bfetch\s*\(|\bXMLHttpRequest\b|\bsendBeacon\s*\(|\bWebSocket\s*\(/],
  ['click', /\.click\s*\(|\bdispatchEvent\s*\(|\bnew\s+(?:Mouse|Pointer|Keyboard)Event\b/],
  ['type', /\.value\s*=[^=]|\binsertText\b|\bexecCommand\s*\(|\.checked\s*=[^=]/],
]

/** The first, most consequential action a tab script would take, or null for a read-only script. */
export function pageActionOf(script: string): PageAction | null {
  return RULES.find(([, pattern]) => pattern.test(script))?.[0] ?? null
}

export type ApprovalDecision = 'once' | 'site' | 'deny'

/** A conversation allowed on a site stays allowed there until the app quits. */
export const approvalKey = (session: string, host: string) => `${session}\n${host}`
