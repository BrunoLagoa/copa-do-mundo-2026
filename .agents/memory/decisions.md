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
