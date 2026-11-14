import type { LinkPreview } from '../types/linkPreview.ts'

export type WindowLinkPreviewApi = {
  linkPreview(url: string): Promise<LinkPreview | null>
}
