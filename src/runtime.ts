'use client'

import * as React from 'react'
import { useMemo, useState } from 'react'
import Image from 'next/image'
import { W1CarouselBlock } from '@werk1/w1-system-carouselblock'
import {
  W1IdmlBlock,
  type IdmlArticleLink,
  type IdmlMediaModuleBlock,
  type IdmlPreloadedArticle,
  type IdmlPreloadedArticlesMap,
} from '@werk1/w1-system-idml/renderer'
import type {
  ArticleBodyProps,
  ArticleMenuComponentProps,
  DefaultArticleBlockProps,
  HeroRendererProps,
  NormalizedArticleRenderData,
  VariantArticleBlockProps,
} from './types'

const h = React.createElement

type PreloadedArticleRuntime = IdmlPreloadedArticle & {
  title?: string | null
  preloadedArticles?: IdmlPreloadedArticlesMap
  __linkIndex?: number
  hero?: {
    url?: string | null
    alt?: string | null
    sizes?: {
      thumb?: { url?: string | null } | null
      sm?: { url?: string | null } | null
      md?: { url?: string | null } | null
    } | null
  } | null
}

type InlineArticleMenuItem = {
  key: string
  href: string
  label: string
  previewUrl: string | null
  previewAlt: string
}

function resolvePreviewUrl(article: PreloadedArticleRuntime): string | null {
  return (
    article.hero?.sizes?.thumb?.url ||
    article.hero?.sizes?.sm?.url ||
    article.hero?.sizes?.md?.url ||
    article.hero?.url ||
    null
  )
}

function buildInlineItems(
  block: IdmlMediaModuleBlock,
  preloadedArticles?: IdmlPreloadedArticlesMap,
): InlineArticleMenuItem[] {
  const blockId = block.id ?? null
  const links = Array.isArray(block.articleLinks) ? block.articleLinks : []
  if (!blockId || !preloadedArticles || links.length === 0) return []

  const items = preloadedArticles[blockId]
  const preloadedForBlock = Array.isArray(items) ? (items as PreloadedArticleRuntime[]) : []
  if (preloadedForBlock.length === 0) return []

  const pairs: Array<{ linkIndex: number; link: IdmlArticleLink; article: PreloadedArticleRuntime }> = []
  for (const article of preloadedForBlock) {
    if (
      typeof article.__linkIndex !== 'number' ||
      article.__linkIndex < 0 ||
      article.__linkIndex >= links.length
    ) {
      continue
    }

    const link = links[article.__linkIndex]
    if (!link) continue

    pairs.push({ linkIndex: article.__linkIndex, link, article })
  }

  pairs.sort((a, b) => a.linkIndex - b.linkIndex)

  return pairs.map(({ article }) => ({
    key: article.slug,
    href: `/articles/${article.slug}`,
    label: article.title ?? article.slug,
    previewUrl: resolvePreviewUrl(article),
    previewAlt: article.title ?? article.slug,
  }))
}

export function ArticleMenuComponent({
  block,
  preloadedArticles,
}: {
  block: IdmlMediaModuleBlock
  preloadedArticles?: IdmlPreloadedArticlesMap
}) {
  const items = useMemo(() => buildInlineItems(block, preloadedArticles), [block, preloadedArticles])
  if (items.length === 0) return null

  return h(
    'nav',
    {
      'aria-label': 'Inline article menu',
      style: {
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        width: '100%',
      },
    },
    items.map((item: InlineArticleMenuItem) =>
      h(
        'a',
        {
          key: item.key,
          href: item.href,
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            textDecoration: 'none',
            color: 'inherit',
          },
        },
        item.previewUrl
          ? h('img', {
              src: item.previewUrl,
              alt: item.previewAlt,
              style: {
                width: '100%',
                aspectRatio: '3 / 2',
                objectFit: 'cover',
                display: 'block',
                borderRadius: 4,
              },
            })
          : null,
        h(
          'span',
          {
            style: {
              fontSize: 14,
              lineHeight: 1.35,
              fontWeight: 500,
            },
          },
          item.label,
        ),
      ),
    ),
  )
}

function pickHeroUrl(hero: HeroRendererProps['hero'], isMobile: boolean): string {
  if (isMobile) {
    return hero.sizes?.sm?.url || hero.sizes?.thumb?.url || hero.url
  }

  return hero.sizes?.xl?.url || hero.sizes?.lg?.url || hero.sizes?.md?.url || hero.url
}

export function HeroRenderer({ hero, isMobile = false }: HeroRendererProps) {
  if (hero.mimeType?.startsWith('video/')) {
    return h('video', { src: hero.url, controls: true, style: { width: '100%', height: 'auto', display: 'block' } })
  }

  if (hero.mimeType?.startsWith('audio/')) {
    return h(
      'audio',
      { src: hero.url, controls: true, style: { width: '100%', display: 'block' } },
      'Your browser does not support the audio element.',
    )
  }

  const src = pickHeroUrl(hero, isMobile)

  return h(Image, {
    src,
    alt: hero.alt ?? '',
    width: hero.width ?? 1920,
    height: hero.height ?? 1080,
    style: { width: '100%', height: 'auto', display: 'block' },
    sizes: '100vw',
    priority: true,
  })
}

export function ArticleBody({ article, deviceInfo, isMobile = false }: ArticleBodyProps) {
  if (!article) return null

  return h(W1IdmlBlock, {
    data: {
      layout: article.idml.layout,
      styleRegistry: article.idml.styleRegistry,
      articleDeltaMap: article.idml.articleDeltaMap,
      preloadedArticles: article.idml.preloadedArticles,
    },
    deviceInfo,
    isMobile,
    mobilePaddingPx: 0,
    preloadedArticles: article.idml.preloadedArticles,
    ArticleMenuComponent,
  })
}

export function ArticleMenu({ items, activeKey, onActivate, deviceInfo, resetToken }: ArticleMenuComponentProps) {
  if (items.length < 2) return null

  const activeIndex = items.findIndex((item) => item.key === activeKey)
  const placeholderDataUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300"%3E%3Crect width="200" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E'
  const thumbSources = items.map(
    (item) =>
      item.previewMedia?.sizes?.thumb?.url ||
      item.previewMedia?.sizes?.sm?.url ||
      item.previewMedia?.url ||
      placeholderDataUrl,
  )

  return h(W1CarouselBlock, {
    key: resetToken ?? 'article-menu',
    deviceInfo,
    mediaSource: { type: 'directAccess', src: thumbSources },
    rendererVariant: 'snappingStrip',
    height: 216,
    onSelectedIndexChange: (idx: number | null) => {
      if (typeof idx !== 'number') return
      const key = items[idx]?.key
      if (key) onActivate(key)
    },
    indexConfig: { initialIndex: activeIndex >= 0 ? activeIndex : 0 },
    snappingStripConfig: {
      thumbHeightPx: 210,
      thumbAspect: 2 / 3,
      gapPx: 6,
      sidePaddingPx: 0,
      snap: 'center',
      thumbRadiusPx: 3,
      activeBorderColor: 'rgba(255, 255, 255, 0.4)',
    },
  })
}

export function DefaultArticleBlock({ block, deviceInfo, isMobile = false }: DefaultArticleBlockProps) {
  if (block.articles.length === 0) {
    throw new Error('DefaultArticleBlock requires at least one article')
  }

  const articleKeys = useMemo(() => new Set(block.articles.map((article) => article.article.slug)), [block.articles])
  const fallbackKey = block.articles[0].article.slug
  const initialKey =
    block.initialActiveArticleKey && articleKeys.has(block.initialActiveArticleKey)
      ? block.initialActiveArticleKey
      : fallbackKey

  const [activeKey, setActiveKey] = useState<string>(initialKey)
  const [lastBlockKey, setLastBlockKey] = useState<string>(block.blockKey)

  if (block.blockKey !== lastBlockKey) {
    setLastBlockKey(block.blockKey)
    if (activeKey !== initialKey) {
      setActiveKey(initialKey)
    }
  }

  if (!articleKeys.has(activeKey)) {
    setActiveKey(initialKey)
  }

  const activeArticle = useMemo(
    () => block.articles.find((article) => article.article.slug === activeKey) ?? block.articles[0],
    [activeKey, block.articles],
  )
  const menuItems = useMemo(
    () => block.menu?.items.filter((item) => articleKeys.has(item.articleSlug)) ?? null,
    [articleKeys, block.menu?.items],
  )

  return h(
    'div',
    { style: { display: 'flex', flexDirection: 'column', width: '100%' } },
    menuItems && menuItems.length > 1
      ? h(ArticleMenu, {
          items: menuItems,
          activeKey,
          onActivate: (key: string) => {
            if (articleKeys.has(key)) setActiveKey(key)
          },
          deviceInfo,
          resetToken: block.blockKey,
        })
      : null,
    activeArticle.hero ? h(HeroRenderer, { hero: activeArticle.hero, isMobile }) : null,
    h(ArticleBody, { article: activeArticle as NormalizedArticleRenderData, deviceInfo, isMobile }),
  )
}

export function ArchiveArticleBlock({ block, deviceInfo, isMobile = false }: VariantArticleBlockProps) {
  return h(
    'section',
    {
      style: {
        width: '100%',
        padding: '1rem 0 2rem',
        borderTop: '1px solid rgba(0,0,0,0.12)',
        background: '#f5f5f2',
      },
    },
    h(
      'div',
      { style: { width: '100%', padding: '0 1rem 1rem', color: '#3b3b39', fontSize: '0.8rem', fontWeight: 600 } },
      'Archive Block',
    ),
    h(DefaultArticleBlock, { block, deviceInfo, isMobile }),
  )
}

export function StoryArticleBlock({ block, deviceInfo, isMobile = false }: VariantArticleBlockProps) {
  return h(
    'section',
    {
      style: {
        width: '100%',
        padding: '2rem 0',
        background: 'linear-gradient(180deg, rgba(247,244,236,0.95), rgba(255,255,255,1))',
      },
    },
    h(
      'div',
      {
        style: {
          width: '100%',
          padding: '0 1rem 1rem',
          color: '#5f5646',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
        },
      },
      'Story Block',
    ),
    h(DefaultArticleBlock, { block, deviceInfo, isMobile }),
  )
}
