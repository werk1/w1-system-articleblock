import type { DeviceInfo } from '@werk1/w1-system-device-info'
import type { W1IdmlBlockData } from '@werk1/w1-system-idml/renderer'

export type ArticleDeviceInfo = DeviceInfo

export type NormalizedHeroMedia = {
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
  mimeType?: string | null
  sizes?: {
    thumb?: { url?: string | null; width?: number | null; height?: number | null } | null
    sm?: { url?: string | null; width?: number | null; height?: number | null } | null
    md?: { url?: string | null; width?: number | null; height?: number | null } | null
    lg?: { url?: string | null; width?: number | null; height?: number | null } | null
    xl?: { url?: string | null; width?: number | null; height?: number | null } | null
  } | null
}

export type NormalizedArticleRenderData = {
  article: {
    id?: string
    slug: string
    title?: string | null
    locale: 'de' | 'en'
    metadata?: Record<string, unknown> | null
  }
  hero: NormalizedHeroMedia | null
  idml: {
    layout: W1IdmlBlockData['layout']
    styleRegistry: W1IdmlBlockData['styleRegistry']
    articleDeltaMap: W1IdmlBlockData['articleDeltaMap']
    preloadedArticles: W1IdmlBlockData['preloadedArticles']
  }
}

export type ArticleMenuItem = {
  key: string
  articleSlug: string
  href?: string
  label?: string | null
  previewMedia?: NormalizedHeroMedia | null
  article: NormalizedArticleRenderData
}

export type ArticleMenuData = {
  source: 'standalone-menu' | 'article-derived' | 'manual' | 'query'
  items: ArticleMenuItem[]
  metadata?: Record<string, unknown> | null
}

export type ArticleBlockInput = {
  blockKey: string
  route: string
  locale: 'de' | 'en'
  articles: NormalizedArticleRenderData[]
  menu: ArticleMenuData | null
  initialActiveArticleKey?: string | null
}

export type ArticleMenuProps = {
  items: ArticleMenuItem[]
  activeKey: string | null
  onActivate: (key: string) => void
}

export type ArticleBodyProps = {
  article: NormalizedArticleRenderData | null
  deviceInfo: ArticleDeviceInfo
  isMobile?: boolean
}

export type ArticleMenuComponentProps = ArticleMenuProps & {
  deviceInfo: ArticleDeviceInfo
  resetToken?: string
}

export type HeroRendererProps = {
  hero: NormalizedHeroMedia
  isMobile?: boolean
}

export type DefaultArticleBlockProps = {
  block: ArticleBlockInput
  deviceInfo: ArticleDeviceInfo
  isMobile?: boolean
}

export type VariantArticleBlockProps = {
  block: ArticleBlockInput
  deviceInfo: ArticleDeviceInfo
  isMobile?: boolean
}
