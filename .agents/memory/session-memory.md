# session-memory.md — Estado da sessão atual

> Atualizado automaticamente via `/memory-save`.
> Última atualização: 2026-04-26 (sessão 4 — horários oficiais FIFA)
> ⚠️ **Atenção:** esta memória estava desatualizada até a sessão 4. Estado real do código (verificado via Serena em 2026-04-26) é muito mais extenso do que o registrado aqui. Use Serena como verdade; este arquivo é contexto, não fonte primária.

---

## Projeto ativo

- **Nome:** copa-2026
- **Caminho:** `/Users/bruno/Dev/pocs/copa-2026`
- **Tipo:** POC / SPA estática
- **Status:** v4 — horários oficiais integrados. Build passando, lint zero erros.
- **Bundle:** 582.18 kB (151.20 kB gzipped) — +1.58% vs v3

---

## Fluxo executado (acumulado)

```
Sessão 1:
/explore   → levantamento de abordagens, dados validados via Wikipedia
/prd       → PRD gerado em prd.md (v1)
/spec      → Spec gerada em spec.md (v1)
/plan      → Plano gerado em plan.md (4 tarefas, 16 subtarefas)
/execute   → Implementação completa fase de grupos (T1–T4)
/review    → Aprovado com ressalvas (divergência de versões documentada)
/memory-save → sessão 1 salva

Sessão 2:
/explore   → bracket interativo, tabs, decisões do usuário coletadas
/plan      → Plano bracket (T1–T5, 7 arquivos)
/execute   → Implementação completa bracket interativo
/memory-save → sessão 2 salva

Sessão 3:
/context   → memória carregada, métricas interpretadas
/workflow  → análise de melhorias, 4 itens aprovados
/plan      → plano detalhado das 4 melhorias
/execute   → 4 melhorias implementadas (bug fix + tema + copiar link + busca)
/memory-save → sessão 3 salva (memória desatualizada — só registra fase de grupos e bracket)

Sessão 4 (atual):
/context   → memória carregada (desatualizada); workflow + plan + execute consecutivos
/workflow  → estratégia PLANEJADA (complexidade alta, risco médio, 0% reprovação prévia)
/plan      → plano T1–T8 (Fixture, helpers, remoção team.games, TeamPage, GroupCard, GamesView, docs, validação)
/execute   → 8/8 tarefas executadas, build + lint limpos, 104 fixtures oficiais FIFA integradas
/review    → pendente
/review-code → pendente
/memory-save → atual (esta sessão)
```

---

## Decisões tomadas pelo usuário

| Decisão | Escolha | Sessão |
|---|---|---|
| Framework | React + TypeScript | 1 |
| Design | Tailwind CSS | 1 |
| Idioma da UI | Português (PT-BR) | 1 |
| Dados do bracket | Interativo (clicar para avançar times) | 2 |
| Layout bracket | Tabs: Grupos / Eliminatórias | 2 |
| Persistência bracket | Somente em memória (useState) | 2 |
| Controle de tema | Manual via ícone — SO ignorado | 3 |
| Busca | Por nome de seleção apenas (sem confederação) | 3 |
| Escopo horários | Copa completa (104 jogos) | 4 |
| Fuso principal | BRT (UTC-3) | 4 |
| Local de exibição | Ambos: aba "Jogos" + GroupCard | 4 |
| Formato visual | "o que ficar melhor" (cards na aba / lista compacta no card) | 4 |
| Integração extra | "o que ficar melhor" (próximo jogo na TeamPage) | 4 |
| Nomes seleções | Manter PT-BR do projeto (não FIFA) | 4 |

---

## Estado dos arquivos (atualizado 2026-04-26)

### Documentação
| Arquivo | Status |
|---|---|
| `prd.md` | ✅ Completo (sessão 4) — features, non-goals, matriz de funcionalidades |
| `spec.md` | ✅ Completo (sessão 4) — stack, estrutura, tipos, modelo Fixture, fluxos |
| `README.md` | ✅ Completo (sessão 4) — features, rotas, dados, correções FIFA |
| `AGENTS.md` | ✅ Intacto |

### Tipos e utilitários
| Arquivo | Status |
|---|---|
| `src/types/index.ts` | Team, Group, BracketTeam, BracketMatch, Round, Fixture, MatchPhase, GroupId, Placeholder, Player, Formation, TeamDetail |
| `src/utils/matchDate.ts` | getTeamMatches, getGroupMatches, getNextTeamMatch, getFixturesByDate, getFixturesByPhase, isDateToday/Future/Past, buildMatchList |
| `src/utils/bracketUtils.ts` | BFS, deriveRounds, buildBracketColumns |
| `src/utils/playerSearch.ts` | Busca cross-seleção |
| `src/utils/playerStats.ts` | Avatares, gradientes |
| `src/utils/playerRankings.ts` | Overall, ranking |
| `src/utils/myTeamStorage.ts` | localStorage |
| `src/utils/slug.ts` | Slug helpers |
| `src/utils/theme.ts` | Tokens de cor |

### Dados
| Arquivo | Status |
|---|---|
| `src/data/groups.ts` | 12 grupos, 48 seleções |
| `src/data/matches.ts` | ✅ **NOVO** (sessão 4) — 104 fixtures oficiais FIFA |
| `src/data/bracket.ts` | 4 rodadas (projeção) |
| `src/data/playerPhotos.ts` | Gerado por script (fetch-avatars.mjs) |
| `src/data/teams/grupo-{a..l}.ts` | 12 arquivos — `games` removido na sessão 4; apenas elenco + comissão |

### Componentes
| Arquivo | Função |
|---|---|
| `App.tsx` | Router + tabs |
| `Header.tsx` | Logo + toggle dark/light |
| `TabNav.tsx` | Tabs (Grupos, Eliminatórias, Simulador, Jogos, Brasil, Busca, Destaques, Comparar, Minha Seleção) |
| `GroupGrid.tsx` | Grid 12 grupos |
| `GroupCard.tsx` | 1 grupo + 3 jogos compactos (`<GroupSchedule>` inline — sessão 4) |
| `GamesView.tsx` | /jogos — calendário com horário BRT (sessão 4: badge fase, mata-mata) |
| `BracketView.tsx` | /bracket — simulador |
| `KnockoutView.tsx` | /knockout — input de placar real |
| `MatchCard.tsx` | Card de confronto (bracket) |
| `ScoreMatchCard.tsx` | Card com input de placar (knockout) |
| `RoundColumn.tsx` | Coluna de rodada |
| `TeamPage.tsx` | /team/:slug — callout "próximo jogo" + formação + jogos (sessão 4) |
| `PlayerPage.tsx` | /player/:teamSlug/:playerNumber |
| `PlayerModal.tsx` | Modal de jogador (formação) |
| `FootballPitch.tsx` | Campo tático |
| `PlayerSearchView.tsx` | /busca |
| `RankingsView.tsx` | /destaques |
| `PlayerComparatorView.tsx` | /comparar |
| `MyTeamView.tsx` | /minha-selecao |
| `ConfirmModal.tsx` | Modal genérico |
| `animate-ui/effects/theme-toggler.tsx` | Animação do toggle |

### Config
| Arquivo | Status |
|---|---|
| `tailwind.config.js` | v3 (content glob correto) |
| `postcss.config.js` | Gerado pelo init |
| `tsconfig.app.json` | `strict: true` |
| `package.json` | Stack: Vite 8, React 19, TS 6, Tailwind 3.4, react-router-dom 7, next-themes, lucide-react |

---

## Versões reais instaladas (vs spec) — sem mudança na sessão 4

| Item | Spec | Instalado | Divergência |
|---|---|---|---|
| React | 18.x | 19.2.5 | Sim — sem impacto |
| Vite | 5.x | 8.0.10 | Sim — sem impacto |
| TypeScript | 5.x | 6.0.2 | Sim — sem impacto |
| Tailwind CSS | 3.x | 3.4.19 | Não — correto |

---

## Próximas ações sugeridas

### Pendentes (sessão 4)
- [ ] `/review` — UI/funcionalidades da integração de horários
- [ ] `/review-code` — profundidade técnica (regressões, acessibilidade, edge cases)

### Pendentes (históricas)
- [ ] Validação visual manual (Playwright via `webapp-testing` skill)
- [ ] Adicionar testes automatizados para `FIXTURES` (snapshot test de 104 entradas)

### Concluídas nesta sessão
- [x] Atualizar `prd.md` — feito
- [x] Atualizar `spec.md` — feito
- [x] Atualizar `README.md` — feito

### Concluídas em sessões anteriores
- [x] Adicionar `prd.md`, `spec.md`, `README.md` completos (sessão 4)
- [x] `team.games` corrigido (sessão 4 — substituído por `Fixture`)
