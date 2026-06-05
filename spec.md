# Copa do Mundo 2026 — Spec Técnica

> Última atualização: 2026-04 (sessão de horários).

## Stack

- **Bundler:** Vite 8
- **Framework:** React 19
- **Linguagem:** TypeScript 6 (`strict: true`)
- **Roteamento:** react-router-dom 7
- **Estilização:** Tailwind CSS **3.4**
- **Ícones:** lucide-react
- **Tema:** next-themes
- **Sem backend**, **sem API externa**, **sem libs de animação** (CSS puro).

## Estrutura de arquivos

```
src/
├── App.tsx                      # Router + tabs
├── main.tsx                     # Bootstrap (BrowserRouter basename=/copa-do-mundo-2026)
├── types/
│   └── index.ts                 # Team, Group, BracketTeam, BracketMatch, Round, Fixture, Player, Formation, TeamDetail
├── data/
│   ├── groups.ts                # 12 grupos (48 seleções)
│   ├── matches.ts               # 104 fixtures oficiais (FIFA, mar/2026)
│   ├── bracket.ts               # Chaveamento do simulador (8 Ro16 + 4 QF + 2 SF + 1 F)
│   ├── playerPhotos.ts          # URLs de avatares
│   └── teams/
│       ├── index.ts             # TEAMS_BY_SLUG
│       └── grupo-{a..l}.ts      # 4 seleções por grupo (elenco + comissão)
├── utils/
│   ├── matchDate.ts             # Helpers Fixture (getTeamMatches, getGroupMatches, getNextTeamMatch, getFixturesByDate, getFixturesByPhase, buildMatchList, isDateToday/Future/Past)
│   ├── bracketUtils.ts          # BFS dependentes, deriveRounds, layout do bracket
│   ├── playerSearch.ts          # Busca de jogadores
│   ├── playerStats.ts           # Avatares, gradientes
│   ├── playerRankings.ts        # Overall, ranking
│   ├── myTeamStorage.ts         # Persistência localStorage
│   ├── slug.ts                  # Slug helpers
│   └── theme.ts                 # Tokens de cor
├── components/
│   ├── Header.tsx               # Logo + toggle dark/light
│   ├── TabNav.tsx               # Tabs de navegação
│   ├── GroupGrid.tsx            # Grid 12 grupos
│   ├── GroupCard.tsx            # 1 grupo (4 times + 3 jogos compactos)
│   ├── GamesView.tsx            # /jogos — calendário com horário BRT
│   ├── BracketView.tsx          # /bracket — simulador (clique para vencedor)
│   ├── KnockoutView.tsx         # /knockout — input de placar real
│   ├── MatchCard.tsx            # Card de jogo no bracket
│   ├── ScoreMatchCard.tsx       # Card com input de placar (knockout)
│   ├── RoundColumn.tsx          # Coluna do bracket
│   ├── TeamPage.tsx             # Página da seleção (elenco + formação + jogos)
│   ├── PlayerPage.tsx           # Página do jogador
│   ├── PlayerModal.tsx          # Modal do jogador (formação)
│   ├── FootballPitch.tsx        # Campo tático
│   ├── PlayerSearchView.tsx     # /busca
│   ├── RankingsView.tsx         # /destaques
│   ├── PlayerComparatorView.tsx # /comparar
│   ├── MyTeamView.tsx           # /minha-selecao
│   ├── ConfirmModal.tsx         # Modal de confirmação
│   └── animate-ui/
│       └── effects/
│           └── theme-toggler.tsx
└── index.css                    # Tailwind base
```

## Tipos principais

```ts
// src/types/index.ts
export interface Team { name: string; flag: string; isHost: boolean; }
export interface Group { id: string; teams: [Team, Team, Team, Team]; }
export interface BracketTeam extends Team { seed?: string; }
export interface BracketMatch {
  id: string;
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  date: string;    // "28 Jun"
  city: string;    // "Los Angeles"
  next: { matchId: string; slot: 'teamA' | 'teamB' } | null;
}
export interface Round { id: string; label: string; matches: BracketMatch[]; }

export type GroupId = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L';
export type MatchPhase = 'group' | 'round-of-32' | 'round-of-16' | 'quarter' | 'semi' | 'third' | 'final';
export type PlaceholderKind = 'winner' | 'runner' | 'third';

export interface Placeholder { kind: PlaceholderKind; group: GroupId; }

export interface Fixture {
  id: string;            // "M1"..."M104"
  phase: MatchPhase;
  matchday?: 1|2|3;      // group
  group?: GroupId;       // group
  date: string;          // ISO "2026-06-11" (em BRT)
  time: string;          // "HH:MM" BRT
  city: string;
  venue: string;
  country: 'México'|'EUA'|'Canadá';
  homeTeam: string;      // nome PT-BR OU placeholder
  awayTeam: string;
  homeSlug: string;      // slug ou "tbd"
  awaySlug: string;
  homeFlag: string;
  awayFlag: string;
  homePlaceholder?: Placeholder;     // mata-mata
  awayPlaceholder?: Placeholder;
  homeThirdGroups?: GroupId[];       // ex: 3º de [C,D,F,G,H]
  awayThirdGroups?: GroupId[];
}

export interface Player { number: number; name: string; position: 'Goleiro'|'Defensor'|'Meio-campista'|'Atacante'; club: string; }
export type Formation = '4-3-3'|'4-4-2'|'4-2-3-1'|...;
export interface TeamDetail { slug: string; team: Team; groupId: string; coach: string; confederation: string; formation: Formation; players: Player[]; }
```

## Modelo de dados — fixtures

**Source of truth:** `src/data/matches.ts` exporta `FIXTURES: Fixture[]` (104 entradas).

- **Grupos (M1–M72):** 24 jogos/dia em 3 rodadas, datas entre 11/jun e 27/jun.
- **Mata-mata (M73–M104):** 32 jogos, 28/jun (32-avos) até 19/jul (Final).
- **Placeholders:** times dos mata-mata usam `homePlaceholder`/`awayPlaceholder` (`kind: 'winner'|'runner'|'third'`, `group: GroupId`) e `homeThirdGroups`/`awayThirdGroups` para combinações de 3ºs.
- **Correções aplicadas vs fonte oficial:** 3 typos (janeiro→junho ×2, M72 data BRT 28/06→27/06).

## Convenções

- **Slug:** kebab-case, sem acentos (`mexico`, `bosnia-herzegovina`, `eua`, `catar`, `ira`, `jordania`).
- **Bandeiras:** emoji regional indicator + ISO code (`🇲🇽`, `🇧🇦`, `🇰🇷`, `🏴󠁧󠁢󠁥󠁮󠁧󠁿`).
- **Tema:** `next-themes` `attribute="class"`, `defaultTheme="light"`, `enableSystem={false}`. Toggle manual no `Header`.
- **localStorage:** `copa2026:eliminatoria:v1` para placares do `KnockoutView`; `copa2026:myTeam:v1` para `MyTeamView`.
- **Acessibilidade:** foco visível via `focus-visible:ring-2 focus-visible:ring-green-500`; botões com `aria-label` quando icônicos; contraste AA garantido com tokens de cor atuais.
- **Responsivo:** 1 coluna (mobile) / 2 (sm) / 3 (md-lg) / 4 (xl) para `GroupGrid`. `KnockoutView` usa scroll horizontal.

## Fluxos principais

1. **Ver grupos** → `/grupos` (12 cards, 4 times cada, 3 jogos compactos).
2. **Ver calendário** → `/jogos` (hoje / próximos / grupos por data / mata-mata por fase).
3. **Ver time** → `/team/:slug` (callout "próximo jogo" + formação tática + elenco + tabela de jogos).
4. **Ver jogador** → `/team/:slug` → clicar no jogador ou na formação.
5. **Simular copa** → `/bracket` (clique nos times para escolher vencedor; reset em cascata).
6. **Acompanhar placar real** → `/knockout` (input de gols + pênaltis; persistência local).

## Decisões registradas (resumo)

Ver `.agents/memory/decisions.md` para o histórico completo. Decisões-chave:
- Vite 8 + React 19 + TS 6 + Tailwind 3
- Tuple `[Team, Team, Team, Team]` em `Group.teams`
- `BracketTeam extends Team` com `seed?: string`
- Reset em cascata via BFS
- Tema dark/light manual (não `prefers-color-scheme`)
- Resultado de jogo: chaves `V`/`E`/`D` em PT-BR
- Busca de seleção client-side
- `Fixture` como single source of truth; `team.games` removido em favor de `getTeamMatches(slug)`
