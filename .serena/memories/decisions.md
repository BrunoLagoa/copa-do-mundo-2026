# Copa 2026 — Key Decisions

## Stack
- Vite 8 + React 19 + TypeScript 6 (strict) + Tailwind CSS v3 (fixed, not v4)
- Language: PT-BR for all UI text and country names
- No API, no backend — 100% static data in TypeScript constants
- YAGNI: no overengineering

## Runtime Dependencies
- `react-router-dom` v7 — explicit user decision, only routing dep
- `next-themes` — theme management (dark/light), `attribute="class"`, `defaultTheme="system"` but toggle is binary light↔dark
- `lucide-react` — icons (Sun, Moon only)
- `animate-ui` ThemeToggler — copied from source (MIT), at `src/components/animate-ui/effects/theme-toggler.tsx`
- No animation libraries — pure CSS `@keyframes` for pitch/modal animations
- No graphics libraries — pure SVG for football pitch
- DiceBear CDN for player avatars (URL, not npm dep) — acceptable for POC

## Routing
- React Router v7 with `BrowserRouter` in `main.tsx`
- Routes: `/`, `/bracket`, `/eliminatoria`, `/team/:slug`, `/player/:teamSlug/:playerNumber`
- `toSlug()` in `src/utils/slug.ts` — single source of truth for URL slug derivation
- `PlayerPage` receives data via `useLocation().state` + fallback lookup via `TEAMS_BY_SLUG`

## Dark Mode
- Tailwind `darkMode: 'class'` in `tailwind.config.js`
- `ThemeProvider` wraps app in `main.tsx` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`)
- Toggle: binary `light ↔ dark` using `resolved` (never `effective` or `system`) — avoids "stuck dark" bug
- Icon: Sun = light mode active, Moon = dark mode active (shows current state)
- Color scale (must be consistent across all components):
  - Page bg:      `bg-gray-50`       / `dark:bg-gray-900`
  - Cards/panels: `bg-white`         / `dark:bg-gray-800`
  - Table thead:  `bg-gray-50`       / `dark:bg-gray-700`
  - Borders:      `border-gray-200`  / `dark:border-gray-700`
  - Row dividers: `divide-gray-100`  / `dark:divide-gray-700`
  - Row hover:    `hover:bg-gray-50` / `dark:hover:bg-gray-700`
  - Nav bar:      `bg-white`         / `dark:bg-gray-900`
  - Text primary: `text-gray-900`    / `dark:text-gray-100`
  - Text secondary:`text-gray-500`   / `dark:text-gray-400`
  - **FootballPitch wrapper**: `bg-gray-50` / `dark:bg-[#121728]` — valor exato para alinhar com page bg dark (`#121728` ≈ `gray-900` mas ligeiramente diferente)

## Data Architecture
- Team data split into 12 files by group: `src/data/teams/grupo-a.ts` … `grupo-l.ts`
- `src/data/teams/index.ts` exports `TEAMS_BY_SLUG: Record<string, TeamDetail>`
- 23 players per team, 7 games (3 group + 4 KO as "A definir")
- `Player.position` values: `'Goleiro' | 'Defensor' | 'Meio-campista' | 'Atacante'` (4 categories)
- `Formation` type: `'4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '3-4-3' | '5-3-2' | '4-5-1' | '4-1-4-1'`
- Player stats are GENERATED (not stored) — see `src/utils/playerStats.ts`
  - Deterministic seed = `number*7 + name.length*13`

## FootballPitch — Drag & Drop
- Jogadores são arrastáveis no campo via **Pointer Events API** (sem dependências)
- Estado: `overrides: Map<playerNumber, {x,y}>` — efêmero (sem persistência — decisão explícita do usuário)
- `dragRef` (useRef) armazena estado de drag — não causa re-render por frame
- `svgRef` usado para `getScreenCTM().inverse()` — converte coords do evento para espaço SVG
- Clique vs drag: threshold 5px (mouse) / 10px (touch) no `pointerUp`
- Boundary clamp: `x: 15..385`, `y: 10..510` (limites do campo)
- `setPointerCapture` garante tracking fora do `<g>`
- `touchAction: 'none'` no SVG previne conflito com scroll mobile
- **Risco known**: `rotateX(28deg)` CSS no wrapper não é incluído em `getScreenCTM()` — pode causar desvio de coordenadas (a validar no browser)
- **Pendente**: remover `onPointerUp` duplicado do `<g>` (handler centralizado no `<svg>` é suficiente)
- Persistência futura: se necessário, usar `localStorage` com chave `copa2026:pitch-overrides:<teamSlug>`

## Components
- `TabNav` — stateless, `NavLink`
- `TeamRow` — `<Link to="/team/:slug">`
- `TeamPage` — `useParams` → lookup → pitch + modal + squad table + fixtures
- `FootballPitch` — SVG 3D pitch, CSS stagger, `onPlayerClick` + `teamSlug` props, hover ring, drag & drop (Pointer Events)
- `PlayerModal` — `createPortal`, ESC/backdrop/× close, scroll lock (iOS fix: `position:fixed`), DiceBear avatar, generated stats bar chart, CTA → PlayerPage. Avatar is OUTSIDE `overflow-hidden` with `-mt-11 z-10` to avoid clipping.
- `PlayerPage` — hero gradient by position, rating pill, stats grid, profile table, teammates grid
- `Header` — contains ThemeToggler button (top-right, `absolute`)

## Utilities
- `src/utils/playerStats.ts` — `generateStats()`, `playerAvatarUrl()`, `positionGradient()`
- `src/utils/slug.ts` — `toSlug()` shared utility
- `src/utils/bracketUtils.ts` — `buildMatchIndex()`, `collectDependents()`, `deriveRounds()`, `buildBracketColumns()`, `COLUMN_LAYOUT_PRESETS`, `COLUMN_MATCH_OFFSETS`

## React Hooks Rule
- ALL hooks MUST be declared BEFORE any early return — strict rules-of-hooks

## Known Issues
- SPA routing: direct URL access fails in `npm run preview` without server config (acceptable for POC — resolved on GitHub Pages via 404.html redirect)

## Build Status
- `npm run build` + `npm run lint` — **zero errors, zero warnings**
- Bundle: ~409 kB JS / 30 kB CSS (gzip: ~112 kB JS)