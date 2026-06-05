# decisions.md — Decisões técnicas registradas

> Atualizado automaticamente via `/memory-save`.
> Fonte: sessão de desenvolvimento da tabela Copa do Mundo 2026.

---

## [2026-04-24] Stack do projeto copa-2026

**Decisão:** Usar Vite + React + TypeScript + Tailwind CSS v3 para SPA estática de grupos da Copa 2026.

**Contexto:** POC de tabela de grupos, sem backend, sem API externa, dados 100% estáticos.

**Detalhes:**
- Bundler: Vite 8.x (template `react-ts`)
- Framework: React 19.x (instalado pelo template — spec definia 18.x; divergência documentada no /review)
- Linguagem: TypeScript 6.x, `strict: true`
- Estilização: Tailwind CSS **3.x** (fixado com `tailwindcss@3` — não v4, breaking changes)
- Gerenciador: npm
- Node: ≥ 18 LTS

**Motivo:** Stack mais adotada para POCs frontend em 2025/2026; dados estáticos eliminam necessidade de backend; Tailwind v3 fixado para evitar breaking changes da v4.

**Impacto:** Alto — define toda a base do projeto.

---

## [2026-04-24] Estrutura de componentes

**Decisão:** Arquitetura bottom-up com componentes stateless e fluxo unidirecional via props.

**Hierarquia:**
```
App → Header (sem dados)
App → TabNav
App → AppRoutes → SearchBar (rota /)
App → AppRoutes → GroupGrid (groups: Group[]) → GroupCard (group: Group) → TeamRow (team: Team, position: number)
```

**Motivo:** Dados 100% estáticos eliminam necessidade de Context, Store ou estado global. Componentes stateless = zero re-renders, zero side effects.

**Impacto:** Médio — padrão reutilizável para projetos similares.

---

## [2026-04-24] Modelo de dados — tuple para comprimento fixo

**Decisão:** Usar tuple `[Team, Team, Team, Team]` em vez de `Team[]` no campo `teams` da interface `Group`.

**Motivo:** Garante comprimento exato de 4 em compile-time, sem necessidade de runtime check. Violação gera erro TypeScript no build.

**Impacto:** Baixo — decisão localizada em `src/types/index.ts`.

---

## [2026-04-24] Dados estáticos — sem API externa

**Decisão:** Todos os dados dos 48 países armazenados como constante TypeScript em `src/data/groups.ts`.

**Motivo:** Copa começa em jun/2026; resultados zerados; API em tempo real não agrega valor nesta fase. YAGNI aplicado.

**Impacto:** Baixo — simplifica arquitetura drasticamente.

---

## [2026-04-24] Nomes de países em PT-BR

**Convenção adotada:**
- "Holanda" (não "Países Baixos")
- "Costa do Marfim" (não "Côte d'Ivoire")
- "EUA" (não "Estados Unidos")
- "Bósnia-Herzegovina"
- "Rep. Dem. Congo"
- "Curaçao"
- "Escócia" / "Inglaterra" (com emojis de subdivisão `🏴󠁧󠁢󠁳󠁣󠁴󠁿` / `🏴󠁧󠁢󠁥󠁮󠁧󠁿`)

**Motivo:** Uso convencional brasileiro, definido no PRD §6.

---

## [2026-04-24] Responsividade — breakpoints Tailwind

**Decisão:** Grid responsivo com 4 breakpoints:
- `grid-cols-1` (< 640px)
- `sm:grid-cols-2` (≥ 640px)
- `md:grid-cols-3` (≥ 768px)
- `xl:grid-cols-4` (≥ 1280px)

**Motivo:** Spec §5 — 12 grupos em grade, legível em mobile (≥ 320px) e desktop.

---

## [2026-04-24] Fase eliminatória — bracket interativo

**Decisão:** Adicionar bracket interativo do Ro16 com navegação por tabs (Grupos / Eliminatórias) e estado somente em memória (`useState`).

**Contexto:** Evolução explícita solicitada pelo usuário após entrega da fase de grupos. PRD original listava "Fase eliminatória" como Non-Goal — reclassificado como escopo ativo.

**Detalhes:**
- Navegação via tabs com `useState<'groups' | 'bracket'>` em `App.tsx`
- Estado do bracket (`winners: Record<string, BracketTeam>`) centralizado em `BracketView` (não em `App`)
- Propagação de vencedores via campo `next: { matchId, slot }` em cada `Match`
- Reset em cascata via BFS sobre o grafo de dependências ao alterar vencedor
- Dados do bracket: constante TypeScript estática em `src/data/bracket.ts` (projeção — não confrontos oficiais)
- Sem persistência (localStorage descartado — YAGNI, decisão do usuário)
- Zero dependências externas adicionadas

**Motivo:** Usuário solicitou explicitamente; padrão de tabs + useState é mínimo viável sem overengineering; BFS para reset é simples, correto e auditável.

**Impacto:** Alto — nova área funcional, 6 arquivos novos, 2 alterados.

---

## [2026-04-24] Herança de tipo — BracketTeam extends Team

**Decisão:** `BracketTeam` estende `Team` com campo opcional `seed?: string` em vez de tipo independente.

**Motivo:** Reutiliza `name`, `flag`, `isHost` sem duplicação. Campo `seed` é opcional — times sem seed (QF/SF/Final) não precisam preencher.

**Impacto:** Baixo — localizado em `src/types/index.ts`.

---

## [2026-04-24] Reset em cascata — BFS sobre grafo de next

**Decisão:** Ao selecionar novo vencedor em um confronto, todos os confrontos downstream são removidos do mapa `winners` via BFS no grafo formado pelo campo `match.next`.

**Motivo:** Garante consistência do bracket sem estado derivado complexo. BFS é O(n) onde n = confrontos downstream (máximo 3 para Ro16). Simples, testável, sem efeitos colaterais.

**Impacto:** Médio — lógica central de `BracketView.tsx`.

---

## [2026-04-24] Tema — controle manual via ícone

**Decisão:** Tema dark/light controlado exclusivamente pelo clique no ícone no header. Sistema operacional ignorado.

**Contexto:** Comportamento anterior seguia `prefers-color-scheme` do SO via `next-themes` com `defaultTheme="system" enableSystem`. Usuário solicitou controle manual.

**Detalhes:**
- `main.tsx`: `defaultTheme="light"`, `enableSystem={false}`
- Preferência persiste em localStorage via `next-themes`
- Toggle no `Header` alterna entre `light` e `dark` com animação via `ThemeToggler`

**Motivo:** Preferência explícita do usuário — controle total independente do SO.

**Impacto:** Baixo — 1 linha alterada em `main.tsx`.

---

## [2026-04-24] Resultado de jogo — chaves V/E/D

**Decisão:** `resultColors` em `TeamPage` usa chaves `V` (vitória), `E` (empate), `D` (derrota) — alinhado com `TeamGame.result: 'V' | 'E' | 'D'` em `types/index.ts`.

**Contexto:** Bug detectado — código original usava `W/D/L` (inglês) mas o tipo TypeScript usa `V/E/D` (português). Vitórias nunca pintavam de verde.

**Impacto:** Baixo — correção localizada em `TeamPage.tsx`.

---

## [2026-04-24] Busca de seleção — filtro client-side

**Decisão:** Campo de busca em `App.tsx` filtra `GROUPS` client-side por nome de time. Visível apenas na rota `/`.

**Detalhes:**
- `AppRoutes` component encapsula `useState<string>` de query e `useLocation`
- `filteredGroups` derivado de `GROUPS.filter()` — sem estado global
- Input com ícone `Search` (lucide-react), tokens de `theme.ts`
- Escopo: nome de seleção apenas (sem confederação — YAGNI)

**Motivo:** 48 seleções exigem navegação eficiente; solução client-side sem dependências novas.

**Impacto:** Médio — refatoração de `App.tsx` (extração de `AppRoutes`).

---

## [2026-04-26] Horários oficiais FIFA integrados (sessão 4)

**Decisão:** Adicionar 104 jogos oficiais da Copa 2026 (FIFA, publicada 30/mar/2026) com data, **horário BRT**, cidade, estádio, em três superfícies de UI: aba `/jogos`, `GroupCard` (3 jogos compactos), e callout "próximo jogo" em `TeamPage`.

**Contexto:** Usuário forneceu a tabela oficial copiada da página FIFA (link original renderizava JS, vazio para scraping). Validei horários de mata-mata via Wikipedia EN (mesma fonte FIFA, dados estruturados). 3 erros de datilografia detectados na fonte e corrigidos manualmente.

**Detalhes:**
- 72 jogos de grupos (3 rodadas × 12 grupos × 2 jogos/dia) + 32 de mata-mata (16 32-avos + 8 oitavas + 4 quartas + 2 semis + 1 3º + 1 final)
- Mata-mata usa placeholders textuais (`Vencedor do Grupo A x 2º do Grupo B`); 3ºs de combinações modelados como `homeThirdGroups: ['C','D','F','G','H']`
- BRT (UTC-3) fixo como fuso principal — sem toggle de fuso na v1
- 3 correções aplicadas:
  1. "21 de janeiro" → "21 de junho" (rodada 2, grupo H — fonte FIFA)
  2. "22 de janeiro" → "22 de junho" (rodada 2, grupo J — fonte FIFA)
  3. M72 (Argentina × Jordânia): data BRT 28/06 → 27/06 (MD3 termina 27/06)

**Motivo:** Usuário pediu explicitamente. Horários são feature central para fãs brasileiros. Fonte oficial evita imprecisões de re-tabulação manual.

**Impacto:** Alto — feature principal, 24 arquivos tocados, +10.4 kB no bundle.

---

## [2026-04-26] BRT como fuso fixo (sessão 4)

**Decisão:** Horário exibido em BRT (UTC-3) exclusivamente. Sem conversão local, sem toggle de fuso.

**Detalhes:**
- `Fixture.time` armazenado como string "HH:MM" em BRT
- Conversão BRT → Date UTC feita internamente em `parseFixtureDateTime()` somando 3h
- `getFixturesByDate` agrupa por data BRT
- `TeamPage` exibe "BRT" como label junto ao horário

**Motivo:** Público-alvo é brasileiro; BRT é o fuso natural. Toggle adicionaria complexidade sem valor (decisão do usuário: "o que ficar melhor").

**Impacto:** Baixo — decisão localizada, mas toca toda a camada de exibição de horário.

---

## [2026-04-26] `Fixture` como single source of truth (sessão 4)

**Decisão:** Remover `TeamGame` e `TeamDetail.games`. Toda informação de jogos vive em `src/data/matches.ts` (`FIXTURES: Fixture[]`, 104 entradas) e é derivada via helpers em `matchDate.ts`.

**Contexto:** Antes da sessão 4, cada time tinha `games: TeamGame[]` próprio em `src/data/teams/grupo-*.ts`. Datas estavam incorretas em vários arquivos (México "12 Jun" em vez de "11 Jun", Brasil "15 Jun" em vez de "13 Jun", etc.). Mata-mata não estava em `team.games` — usava apenas `KO_GAMES` placeholder.

**Detalhes:**
- Novo tipo `Fixture` em `src/types/index.ts` com: id, phase, matchday?, group?, date (ISO), time (BRT HH:MM), city, venue, country, homeTeam, awayTeam, homeSlug, awaySlug, flags, placeholders
- Helpers em `src/utils/matchDate.ts`: `getTeamMatches(slug)`, `getGroupMatches(group)`, `getNextTeamMatch(slug)`, `getFixturesByDate()`, `getFixturesByPhase()`, `isDateToday/Future/Past`
- 12 arquivos `grupo-*.ts` ficaram ~7 linhas mais curtos cada (games removido)
- `TeamPage` agora chama `getTeamMatches(slug)` para a tabela de jogos
- `MatchEntry` (compat legada para `GamesView` antigo) re-exporta `Fixture` com campos extras (`time`, `fullDate`, `phase`, `group`, `country`, `isPlaceholder`)

**Motivo:** Dados duplicados (team.games vs mata-mata) geravam inconsistências e datas erradas. Single source of truth garante que mudança de horário pela FIFA toca apenas 1 arquivo.

**Impacto:** Alto — refactor arquitetural, 24 arquivos.

---

## [2026-04-26] Rename `Match` → `BracketMatch` (sessão 4)

**Decisão:** Renomear o tipo `Match` (que representava apenas jogos do bracket) para `BracketMatch` para liberar o nome `Match` para o novo `Fixture` (ou uso futuro).

**Contexto:** Novo `Fixture` precisava coexistir com `Match` no mesmo módulo. Conflito de nome entre conceito geral (jogo da copa) e conceito específico (jogo do bracket).

**Detalhes:**
- `src/types/index.ts`: `Match` → `BracketMatch`
- Imports atualizados em: `bracketUtils.ts`, `MatchCard.tsx`, `ScoreMatchCard.tsx`, `KnockoutView.tsx`
- `data/bracket.ts` não importava o tipo explicitamente, não precisou mudar
- 1 PR de refactor, sem impacto funcional

**Motivo:** Clareza semântica. `BracketMatch` é específico do simulador/knockout; `Fixture` (futuro) será geral.

**Impacto:** Baixo — refactor isolado, tsc detectou todos os consumidores.

---

## [2026-04-26] Bundle +5 kB gzipped como limite aceitável (sessão 4, observacional)

**Observação:** Bundle cresceu de 148.84 kB → 151.20 kB gzipped (+1.58%) após adicionar 104 fixtures. Considerado aceitável (não justifica code-splitting nesta POC).

**Motivo:** 104 entradas × ~150 bytes em JSON compacto é eficiente. Code-splitting dinâmico de `GamesView`/`KnockoutView`/`BracketView` reduziria ~30% do bundle mas adicionaria complexidade de loading.

**Impacto:** Baixo — registro para referência futura. Se projeto crescer, reavaliar.

---

## [2026-04-26] Memória precisa ser fonte secundária, código é verdade (sessão 4, meta)

**Observação:** A memória `.agents/memory/*` da sessão 3 estava significativamente desatualizada: não documentava `KnockoutView`, `MyTeamView`, `PlayerComparatorView`, `PlayerSearchView`, `RankingsView`, nem o uso de `team.games` para os 48 times. A verdade estava no código (via Serena).

**Lição:** Antes de confiar em `decisions.md`/`session-memory.md`, validar contra o estado real com Serena. Memórias podem divergir se `/memory-save` não for chamado em cada sessão significativa.

**Ação proposta:** Adicionar sugestão para revisar memórias em cada `/workflow` (não apenas no fim de `/execute`).

**Impacto:** Meta — afeta qualidade futura da memória do projeto.
