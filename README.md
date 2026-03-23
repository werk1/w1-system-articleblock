# @werk1/w1-system-articleblock

`@werk1/w1-system-articleblock` enthält die **UI- und Renderer-Schicht** für Article-Blöcke im W1-System.

Das Paket rendert vorbereitete Article-Daten, stellt die Varianten-Komponenten für Article-Blöcke bereit und registriert die zugehörigen Media-Module-Renderer. Die **Resolver-, Query- und Payload-Logik** gehört **nicht** in dieses Paket, sondern bleibt im konsumierenden System, aktuell also in `w1-system-core-v2` unter `src/lib/blocks/article`.

## Zweck

Das Paket trennt die Darstellung von der Datenbeschaffung:

- **Hier im Paket:**
  - React-Komponenten für Article-Blöcke
  - Hero-Rendering
  - Article-Body-Rendering über IDML-Renderer
  - Artikel-Menü-Rendering
  - Registrierung der Standard-Media-Module für Artikel
  - Laden optionaler Artikel-Media-Plugins

- **Nicht hier im Paket:**
  - Auflösung von Artikeln aus Payload
  - Menü-/Query-Resolver
  - Locale-/Slug-Normalisierung
  - Aufbau von `ArticleBlockInput`
  - Page-Section-Resolver

## Was das Paket exportiert

### Komponenten

- `DefaultArticleBlock`
- `ArchiveArticleBlock`
- `StoryArticleBlock`
- `ArticleBody`
- `ArticleMenu`
- `ArticleMenuComponent`
- `HeroRenderer`

### Runtime-Helfer

- `registerDefaultArticleMediaModuleRenderers`
- `loadArticleMediaModulePlugins`

### Typen

- `ArticleBlockInput`
- `NormalizedArticleRenderData`
- `ArticleMenuData`
- `ArticleMenuItem`
- `ArticleMenuProps`
- `ArticleBodyProps`
- `DefaultArticleBlockProps`
- `VariantArticleBlockProps`
- `HeroRendererProps`
- `NormalizedHeroMedia`
- `ArticleDeviceInfo`

## Wie es funktioniert

Das Paket erwartet bereits **vorbereitete Artikel-Daten**. Die zentrale Eingabestruktur ist `ArticleBlockInput`.

Typisch ist der Ablauf so:

1. Das konsumierende System lädt Artikel, Menüs oder Query-Ergebnisse.
2. Das konsumierende System baut daraus ein `ArticleBlockInput`.
3. Das konsumierende System ergänzt an einer zentralen Stelle `deviceInfo` und `isMobile`.
4. Das Paket rendert den passenden Block.
5. Für IDML-Inhalte nutzt das Paket die Renderer aus `@werk1/w1-system-idml/renderer`.
6. Für Media-Module werden die Standard-Renderer registriert und optionale Plugins bei Bedarf nachgeladen.

## Architektur

### Im Paket

- `src/runtime.ts`
  - enthält die eigentlichen Article-Komponenten
- `src/registerDefaultArticleMediaModuleRenderers.tsx`
  - registriert Standard-Renderer für Artikel-Media-Module
  - lädt optionale Plugins
- `src/types.ts`
  - enthält die gemeinsam genutzten Eingabetypen
- `src/index.ts`
  - Barrel-Export des Pakets

### Im konsumierenden Core

In `w1-system-core-v2` bleibt typischerweise:

- `src/lib/blocks/article/buildNormalizedArticleRenderData.ts`
- `src/lib/blocks/article/resolveArticleBlockInput.ts`
- `src/lib/blocks/article/resolveArticleBlockComponent.ts`
- `src/lib/blocks/article/resolveArticleQuery.ts`
- `src/lib/blocks/article/createHybridPageResolveContext.ts`
- `src/lib/blocks/article/utils/*`

Das heißt:

- **Core baut die Daten auf**
- **Core ergänzt die Runtime-Anbindung**
- **dieses Paket rendert sie**

## Einbindung in ein Projekt

### 1. Paket als Dependency eintragen

Beispiel in `package.json` des konsumierenden Projekts:

```json
{
  "dependencies": {
    "@werk1/w1-system-articleblock": "file:../w1-system-articleblock"
  }
}
```

### 2. Next.js das Paket transpilen lassen

Wenn das Paket als Quellcode aus dem Monorepo eingebunden wird, sollte es in `next.config.*` unter `transpilePackages` auftauchen.

Beispiel:

```js
transpilePackages: ['@werk1/w1-system-articleblock']
```

### 3. TypeScript-Pfadauflösung sicherstellen

Wenn das Paket direkt aus `src` konsumiert wird, braucht das konsumierende Projekt in der Regel einen passenden `paths`-Eintrag.

Beispiel:

```json
{
  "compilerOptions": {
    "paths": {
      "@werk1/w1-system-articleblock": [
        "../w1-system-articleblock/src/index.ts"
      ]
    }
  }
}
```

### 4. Zentrale Core-Anbindung in `resolveArticleBlockComponent.ts`

Die Paket-Komponenten erwarten `deviceInfo` und optional `isMobile`.

Statt mehrere Wrapper-Dateien im Core zu behalten, wird die Store-Anbindung zentral in `src/lib/blocks/article/resolveArticleBlockComponent.ts` gekapselt.

Beispiel:

```ts
import type { ArticleBlockComponent } from '@/lib/pages/types'
import type { ArticleBlockInput } from '@/lib/blocks/article/types'
import React from 'react'
import {
  ArchiveArticleBlock as W1ArchiveArticleBlock,
  DefaultArticleBlock as W1DefaultArticleBlock,
  StoryArticleBlock as W1StoryArticleBlock,
} from '@werk1/w1-system-articleblock'
import { useBoundStore } from '@/stores/boundStore'

const h = React.createElement

function adaptArticleBlockComponent(
  Component: React.ComponentType<{
    block: ArticleBlockInput
    deviceInfo: ReturnType<typeof useBoundStore.getState>['device']
    isMobile?: boolean
  }>,
): ArticleBlockComponent {
  return function ArticleBlockComponentAdapter({ block }) {
    const isMobile = Boolean(useBoundStore((state) => state.device.is_deviceM))
    const deviceInfo = useBoundStore((state) => state.device)

    return h(Component, { block, deviceInfo, isMobile })
  }
}

const articleBlockRegistry: Record<string, ArticleBlockComponent> = {
  default: adaptArticleBlockComponent(W1DefaultArticleBlock),
  story: adaptArticleBlockComponent(W1StoryArticleBlock),
  archive: adaptArticleBlockComponent(W1ArchiveArticleBlock),
}
```

Damit bleibt das Paket generisch, während die Core-spezifische Store-Anbindung nur an einer Stelle lebt.

### 5. Standard-Media-Renderer im Frontend registrieren

Die Renderer sollten einmal beim Frontend-Start registriert werden.

Beispiel:

```tsx
'use client'

import { useEffect } from 'react'
import {
  loadArticleMediaModulePlugins,
  registerDefaultArticleMediaModuleRenderers,
} from '@werk1/w1-system-articleblock'
import { useBoundStore } from '@/stores/boundStore'

export function FrontendRuntimeBootstrap({ enabledPlugins = [] }: { enabledPlugins?: string[] }) {
  useEffect(() => {
    registerDefaultArticleMediaModuleRenderers({
      getVideoCoordinationStore: () => useBoundStore.getState(),
    })

    void loadArticleMediaModulePlugins(enabledPlugins, {
      getVideoCoordinationStore: () => useBoundStore.getState(),
    })
  }, [enabledPlugins])

  return null
}
```

## Erwartete Eingabedaten

Das Paket arbeitet mit `ArticleBlockInput`.

Vereinfacht besteht es aus:

- `blockKey`
- `route`
- `locale`
- `articles`
- `menu`
- `initialActiveArticleKey`

Jeder Artikel enthält:

- Metadaten des Artikels
- normalisierte Hero-Medien
- IDML-Layout-Daten
- Style-Registry
- Delta-Map
- preloaded article menus

Das Paket **holt diese Daten nicht selbst** aus Payload.

## Media-Module

Die Standard-Renderer werden über `registerDefaultArticleMediaModuleRenderers` registriert.

Aktuell sind dafür Renderer im Paket vorgesehen für typische Module wie:

- `image`
- `carousel-strip`
- `carousel-scrub`
- `slideshow`
- `video`
- `audio`
- `gallery`

Zusätzliche, optionale Renderer können über `loadArticleMediaModulePlugins` nachgeladen werden.

## Build

Im Paket steht ein einfacher Build-Check zur Verfügung:

```bash
npm run build
```

Aktuell ist dieser Build ein **TypeScript-Check**:

```bash
npm run typecheck
```

Wenn im Paket selbst kein lokales `tsc` installiert ist, nutzt das Skript den TypeScript-Compiler aus dem benachbarten `w1-system-core-v2`-Workspace.

## Voraussetzungen

Das Paket setzt voraus, dass das konsumierende Projekt passende Peer-/Runtime-Abhängigkeiten bereitstellt, insbesondere:

- `react`
- `react-dom`
- `next`
- `@werk1/w1-system-idml`
- `@werk1/w1-system-device-info`
- `@werk1/w1-system-videoblock`
- `@werk1/w1-system-carouselblock`
- `@werk1/w1-system-audioblock`

## Einsatzgrenze

Dieses Paket ist **kein vollständiges Articles-Backend-Modul**.

Es ist ein **Renderer-Paket**. Alles, was mit Datenauflösung, Payload-Lookups, Query-Definitionen, Cache, Slug-Strategie oder Locale-Resolvern zu tun hat, soll im konsumierenden System bleiben.

## Kurzfassung

- `w1-system-core-v2` baut `ArticleBlockInput`
- `@werk1/w1-system-articleblock` rendert den Block
- Media-Renderer werden im Frontend registriert
- optionale Plugins können lazy geladen werden
- Resolver-Logik bleibt im Core
