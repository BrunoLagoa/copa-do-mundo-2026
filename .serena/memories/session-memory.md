# Session Memory — Copa 2026

## Última atualização
2026-04-25 (sessão 2)

## Estado atual do projeto
- SPA Copa do Mundo 2026 em React 19 + Vite 8 + TypeScript 6 + Tailwind v3
- Build: zero erros, zero warnings de lint
- Bundle: ~396 kB JS gzip ~109 kB

## Funcionalidades implementadas
1. **Grupos** — grid 4 colunas (12 grupos × 4 times), cards com flag + nome + badge Anfitrião
2. **Simulador** — bracket interativo com seleção de vencedores por clique
3. **Eliminatórias** — bracket com placares reais, avanço automático por gols, desempate por pênaltis, persistência em localStorage (`copa2026:eliminatoria:v1`)
4. **TeamPage** — campo 3D SVG com formação tática, elenco em tabela, jogos/resultados
5. **PlayerModal** — portal sobre o campo, avatar DiceBear, stats geradas, CTA para perfil
6. **PlayerPage** — perfil completo do jogador com hero, stats, companheiros de posição
7. **Dark/Light mode** — ThemeToggler animate-ui + next-themes, toggle binário light↔dark


## Problemas corrigidos nesta sessão
- `useState` após early return → movido antes do guard (rules-of-hooks)
- Toggle dark mode "preso" → ciclo `system` removido, agora binário `light↔dark` usando `resolved`
- Avatar cortado no modal → removido `overflow-hidden` do card raiz, avatar com `z-10` e `-mt-11`
- Sem contraste dark mode → escala de cinzas unificada (page=gray-900, card=gray-800, thead=gray-700)
- Padding TeamPage → `px-4 sm:px-6`, pitch container `p-4 sm:p-6`

## Arquivos principais
- `src/App.tsx` — rotas (inclui `/eliminatoria`)
- `src/main.tsx` — `ThemeProvider` + `BrowserRouter`
- `src/components/Header.tsx` — ThemeToggler (Sun/Moon)
- `src/components/TabNav.tsx` — tabs: Grupos | Eliminatórias | Simulador
- `src/components/animate-ui/effects/theme-toggler.tsx` — componente animate-ui (MIT)
- `src/components/FootballPitch.tsx` — SVG 3D pitch
- `src/components/PlayerModal.tsx` — portal modal
- `src/components/PlayerPage.tsx` — perfil completo
- `src/components/TeamPage.tsx` — página da seleção
- `src/components/EliminatoriaView.tsx` — bracket com placares reais + localStorage
- `src/components/ScoreMatchCard.tsx` — card com inputs de gols + tiebreaker pênaltis
- `src/utils/playerStats.ts` — stats determinísticas + `playerAvatarUrl` (DiceBear-only)
- `src/utils/bracketUtils.ts` — funções compartilhadas de bracket
- `src/data/teams/index.ts` — TEAMS_BY_SLUG
- `tailwind.config.js` — `darkMode: 'class'`
- `vite.config.ts` — `base: '/copa-do-mundo-2026/'`
- `.github/workflows/deploy.yml` — GitHub Actions deploy para Pages
- `public/404.html` — SPA redirect para GitHub Pages

## Arquivos removidos
- `src/hooks/usePlayerPhoto.ts` — removido (integração externa eliminada)
