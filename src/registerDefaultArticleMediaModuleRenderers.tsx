'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { W1AudioBlock } from '@werk1/w1-system-audioblock'
import { W1CarouselBlock } from '@werk1/w1-system-carouselblock'
import type { DeviceInfo } from '@werk1/w1-system-device-info'
import {
  getIdmlMediaModuleRenderer,
  registerIdmlMediaModuleRenderer,
  type IdmlMediaModuleRendererProps,
} from '@werk1/w1-system-idml/renderer'
import { W1VideoBlock } from '@werk1/w1-system-videoblock'

type VideoCoordinationStoreGetter = React.ComponentProps<typeof W1VideoBlock>['videoCoordinationStore']

export type RegisterArticleMediaModuleRenderersOptions = {
  getVideoCoordinationStore?: VideoCoordinationStoreGetter
}

const loadedPluginKeys = new Set<string>()

const ARROW_BUTTON_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.5)',
  color: 'white',
  border: 'none',
  padding: '10px 15px',
  cursor: 'pointer',
  borderRadius: 4,
}

const DOT_BUTTON_BASE_STYLE: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

function registerRenderer(
  key: string,
  renderer: (props: IdmlMediaModuleRendererProps) => React.ReactNode,
) {
  registerIdmlMediaModuleRenderer(key, renderer)
}

export function registerDefaultArticleMediaModuleRenderers(
  options: RegisterArticleMediaModuleRenderersOptions = {},
) {
  if (!getIdmlMediaModuleRenderer('image')) {
    registerRenderer('image', (props) => {
      const objectFit = (props.config.objectFit as string) ?? 'contain'
      const objectPosition = (props.config.objectPosition as string) ?? 'center'
      const preferredSources = props.isMobile ? props.mediumSources : props.largeSources
      const fallbackSources = props.isMobile ? props.largeSources : props.mediumSources
      const src = preferredSources[0] || fallbackSources[0]
      if (!src) return null

      return (
        <div
          style={{
            width: '100%',
            height: `${props.height}px`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src={src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: objectFit as React.CSSProperties['objectFit'],
              objectPosition,
            }}
          />
        </div>
      )
    })
  }

  if (!getIdmlMediaModuleRenderer('carousel-strip')) {
    registerRenderer('carousel-strip', (props) => {
      const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

      return (
        <>
          <W1CarouselBlock
            deviceInfo={props.deviceInfo as DeviceInfo}
            mediaSource={{ type: 'directAccess', src: props.thumbSources }}
            rendererVariant="kineticFreeStrip"
            height={Math.min(props.height, 216)}
            kineticFreeStripConfig={{
              thumbHeightPx: 210,
              thumbAspect: 2 / 3,
              gapPx: 6,
              sidePaddingPx: 0,
              thumbRadiusPx: 3,
              activeBorderColor: 'rgba(255, 255, 255, 0.4)',
              overscrollMaxPx: 200,
              bounceMs: 300,
              minFlingVelocity: 0.15,
              velocitySmoothing: 0.9,
              maxFlingVelocity: 3,
            }}
            onSelectedIndexChange={setSelectedIndex}
          />
          {selectedIndex !== null && props.largeSources[selectedIndex] ? (
            <div
              key={selectedIndex}
              style={{
                width: '100%',
                height: props.height,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <img
                src={props.largeSources[selectedIndex]}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </div>
          ) : null}
        </>
      )
    })
  }

  if (!getIdmlMediaModuleRenderer('carousel-scrub')) {
    registerRenderer('carousel-scrub', (props) => {
      const autoplay = Boolean(props.config.autoplay)
      const autoplayIntervalMs = Number(props.config.autoplayInterval) || 5000

      return (
        <W1CarouselBlock
          deviceInfo={props.deviceInfo as DeviceInfo}
          mediaSource={{ type: 'directAccess', src: props.mediumSources }}
          interactionMode="scrub"
          scrubConfig={{
            commitThreshold: 0.25,
            velocityThreshold: 0.5,
            settleMs: 220,
            edgeResistance: 0.25,
          }}
          autoplayConfig={{ autoplay, autoplayIntervalMs }}
          width="100%"
          height={props.height}
          showArrows={props.showArrows}
          showDotsIndicator={props.showDots}
          showProgress={props.showProgress}
        />
      )
    })
  }

  if (!getIdmlMediaModuleRenderer('slideshow')) {
    registerRenderer('slideshow', (props) => {
      const [currentIndex, setCurrentIndex] = useState(0)
      const autoplay = Boolean(props.config.autoplay)
      const interval = (props.config.autoplayInterval as number) || 3000
      const preferredSources = props.isMobile ? props.mediumSources : props.largeSources
      const fallbackSources = props.isMobile ? props.largeSources : props.mediumSources
      const sources = preferredSources.length > 0 ? preferredSources : fallbackSources

      useEffect(() => {
        if (!autoplay || sources.length <= 1) return

        const timer = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % sources.length)
        }, interval)

        return () => clearInterval(timer)
      }, [autoplay, interval, sources.length])

      const activeIndex = useMemo(
        () => (sources.length === 0 ? 0 : Math.min(currentIndex, sources.length - 1)),
        [currentIndex, sources.length],
      )

      if (sources.length === 0) return null

      return (
        <div style={{ position: 'relative', width: '100%', height: props.height }}>
          <img
            src={sources[activeIndex]}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          {props.showArrows && sources.length > 1 ? (
            <>
              <button onClick={() => setCurrentIndex((prev) => (prev - 1 + sources.length) % sources.length)} style={{ ...ARROW_BUTTON_STYLE, left: 10 }}>
                ‹
              </button>
              <button onClick={() => setCurrentIndex((prev) => (prev + 1) % sources.length)} style={{ ...ARROW_BUTTON_STYLE, right: 10 }}>
                ›
              </button>
            </>
          ) : null}
          {props.showDots && sources.length > 1 ? (
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 8,
              }}
            >
              {sources.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  style={{
                    ...DOT_BUTTON_BASE_STYLE,
                    background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.5)',
                  }}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      )
    })
  }

  if (!getIdmlMediaModuleRenderer('video')) {
    registerRenderer('video', (props) => {
      const mediaItem = props.mediaItems[0]
      if (!mediaItem) return null

      const s = mediaItem.sizes
      const videoSrc = s?.lg?.url || s?.xl?.url || s?.md?.url || mediaItem.url || null
      if (!videoSrc) return null

      return (
        <W1VideoBlock
          src={videoSrc}
          autoplay={(props.config.autoplay as boolean) ?? false}
          muted={(props.config.muted as boolean) ?? true}
          loop={(props.config.loop as boolean) ?? false}
          showControls={(props.config.controls as boolean) ?? true}
          objectFit="contain"
          videoCoordinationStore={options.getVideoCoordinationStore}
          style={{ width: '100%', height: (props.config.height as number | string) ?? 'auto' }}
        />
      )
    })
  }

  if (!getIdmlMediaModuleRenderer('audio')) {
    registerRenderer('audio', (props) => {
      const mediaItem = props.mediaItems[0]
      if (!mediaItem) return null

      const audioSrc = mediaItem.url || null
      if (!audioSrc) return null

      return (
        <W1AudioBlock
          src={audioSrc}
          autoplay={(props.config.autoplay as boolean) ?? false}
          loop={(props.config.loop as boolean) ?? false}
          showControls
          showProgress
          showWaveform={(props.config.showWaveform as boolean) ?? false}
          controlsVariant="full"
          deviceInfo={props.deviceInfo as DeviceInfo}
        />
      )
    })
  }

  if (!getIdmlMediaModuleRenderer('gallery')) {
    registerRenderer('gallery', (props) => {
      return (
        <W1CarouselBlock
          deviceInfo={props.deviceInfo as DeviceInfo}
          mediaSource={{ type: 'directAccess', src: props.mediumSources }}
          rendererVariant="snappingStrip"
          snappingStripConfig={{
            thumbHeightPx: Math.min(props.height, 300),
            thumbAspect: 4 / 3,
            gapPx: 8,
            snap: 'center',
            thumbRadiusPx: 4,
          }}
          width="100%"
          height={Math.min(props.height, 300)}
          showDotsIndicator={props.showDots}
          showArrows={props.showArrows}
        />
      )
    })
  }
}

export async function loadArticleMediaModulePlugins(
  enabledKeys: string[],
  options: RegisterArticleMediaModuleRenderersOptions = {},
): Promise<void> {
  registerDefaultArticleMediaModuleRenderers(options)

  for (const key of enabledKeys) {
    if (loadedPluginKeys.has(key)) continue
    loadedPluginKeys.add(key)

    if (key !== 'audio' && process.env.NODE_ENV !== 'production') {
      console.warn(`[ArticleMediaModulePlugins] Plugin "${key}" is enabled but not available.`)
    }
  }
}
