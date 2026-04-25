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
- Routes: `/`, `/bracket`, `/team/:slug`, `/player/:teamSlug/:playerNumber`
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

## Data Architecture
- Team data split into 12 files by group: `src/data/teams/grupo-a.ts` … `grupo-l.ts`
- `src/data/teams/index.ts` exports `TEAMS_BY_SLUG: Record<string, TeamDetail>`
- 23 players per team, 7 games (3 group + 4 KO as "A definir")
- `Player.position` values: `'Goleiro' | 'Defensor' | 'Meio-campista' | 'Atacante'` (4 categories)
- `Formation` type: `'4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '3-4-3' | '5-3-2' | '4-5-1' | '4-1-4-1'`
- Player stats are GENERATED (not stored) — see `src/utils/playerStats.ts`
  - Deterministic seed = `number*7 + name.length*13`

## Components
- `TabNav` — stateless, `NavLink`
- `TeamRow` — `<Link to="/team/:slug">`
- `TeamPage` — `useParams` → lookup → pitch + modal + squad table + fixtures
- `FootballPitch` — SVG 3D pitch, CSS stagger, `onPlayerClick` + `teamSlug` props, hover ring
- `PlayerModal` — `createPortal`, ESC/backdrop/× close, scroll lock (iOS fix: `position:fixed`), DiceBear avatar, generated stats bar chart, CTA → PlayerPage. Avatar is OUTSIDE `overflow-hidden` with `-mt-11 z-10` to avoid clipping.
- `PlayerPage` — hero gradient by position, rating pill, stats grid, profile table, teammates grid
- `Header` — contains ThemeToggler button (top-right, `absolute`)

## Utilities
- `src/utils/playerStats.ts` — `generateStats()`, `playerAvatarUrl()`, `positionGradient()`
- `src/utils/slug.ts` — `toSlug()` shared utility

## React Hooks Rule
- ALL hooks MUST be declared BEFORE any early return — strict rules-of-hooks

## Known Issues
- `mexico` slug appears in both `grupo-a.ts` and `grupo-l.ts` — pre-existing data duplication
- SPA routing: direct URL access fails in `npm run preview` without server config (acceptable for POC)

## Build Status
- `npm run build` + `npm run lint` — zero errors
- Bundle: ~396 kB JS / 23 kB CSS (gzip: ~109 kB JS)
