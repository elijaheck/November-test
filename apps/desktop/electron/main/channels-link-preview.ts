import { getLinkPreview } from '../linkPreview'

export const linkPreviewChannels = {
  'linkPreview:get': (_e: unknown, url: string) => getLinkPreview(url),
} as const
