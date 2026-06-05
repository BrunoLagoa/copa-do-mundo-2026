# 🏆 Copa do Mundo 2026

> 48 seleções. 12 grupos. 104 jogos. 1 troféu.
> Acompanhe a fase de grupos, marque os jogos no calendário (horário BRT), registre os placares das eliminatórias e monte o seu bracket.

---

## O que é isso?

Uma SPA 100% estática para explorar a Copa do Mundo FIFA 2026 — a maior edição da história, com 48 seleções distribuídas em 12 grupos e jogos em 16 cidades-sede (Canadá, México, EUA). Calendário oficial completo (FIFA, mar/2026) com data, **horário BRT**, estádio e cidade.

Sem backend. Sem API. Sem frescura. Só futebol.

---

## Funcionalidades

| Feature | Descrição |
|---|---|
| 🗂 **Fase de grupos** | 12 grupos (A–L), 48 seleções. Cada `GroupCard` mostra os 3 jogos do grupo com horário BRT. |
| 📅 **Calendário completo** | Todos os 104 jogos (grupos + mata-mata) com data, **horário BRT**, estádio e cidade. Filtro "Jogos de hoje" em destaque. |
| 🔍 **Busca de seleção** | Filtro client-side em tempo real pelo nome da seleção. |
| 📋 **Eliminatórias** | Insira o placar de cada confronto; vencedor avança automaticamente. Empate → escolha o vencedor nos pênaltis. Persistência em `localStorage`. |
| 🏟 **Simulador (Bracket)** | Monte o seu chaveamento das oitavas à final selecionando os vencedores manualmente. |
| 👕 **Perfil de seleção** | Elenco, formação tática interativa, comissão técnica, confederacao, próximos jogos (com callout), tabela completa de jogos. |
| ⚽ **Perfil de jogador** | Estatísticas individuais, foto, posição no campo, navegação entre elencos. |
| 🔎 **Busca de jogadores** | Busca cross-seleção por nome, posição, clube. |
| 🌟 **Destaques** | Rankings por posição e overall. |
| ⚖️ **Comparar** | Comparativo lado a lado entre dois jogadores. |
| ⭐ **Minha Seleção** | 11 slots, formação customizável, persistência local. |
| 🌙 **Tema dark/light** | Alterne manualmente pelo ícone no header. |

---

## Como rodar

**Pré-requisito:** Node.js ≥ 18

```bash
npm install
npm run dev
```

Acesse [http://localhost:5173/copa-do-mundo-2026](http://localhost:5173/copa-do-mundo-2026)

### Outros comandos

```bash
npm run build    # tsc -b && vite build
npm run preview  # preview do build
npm run lint     # ESLint
```

---

## Rotas

| Rota | Página |
|---|---|
| `/grupos` | Fase de grupos (com busca) |
| `/jogos` | Calendário completo (grupos + mata-mata) com horário BRT |
| `/knockout` | Eliminatórias — input de placar real |
| `/bracket` | Simulador de chaveamento |
| `/team/brasil` | Atalho para a página do Brasil 🇧🇷 |
| `/busca` | Busca de jogadores |
| `/destaques` | Rankings de jogadores |
| `/comparar` | Comparador de jogadores |
| `/minha-selecao` | Minha seleção (formação + 11 slots) |
| `/team/:slug` | Perfil de qualquer seleção |
| `/player/:teamSlug/:playerNumber` | Perfil de jogador |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 |
| Linguagem | TypeScript 6 (`strict: true`) |
| Bundler | Vite 8 |
| Estilo | Tailwind CSS **3.4** |
| Roteamento | React Router 7 |
| Ícones | Lucide React |
| Tema | next-themes |

---

## Estrutura

```
src/
├── components/
│   ├── GroupGrid.tsx               # Grid dos 12 grupos
│   ├── GroupCard.tsx               # Card de grupo (4 times + 3 jogos compactos)
│   ├── GamesView.tsx               # /jogos — calendário com horário BRT
│   ├── KnockoutView.tsx            # /knockout — input de placar real
│   ├── BracketView.tsx             # /bracket — simulador
│   ├── MatchCard.tsx               # Card de confronto (bracket)
│   ├── ScoreMatchCard.tsx          # Card com input de placar (knockout)
│   ├── RoundColumn.tsx             # Coluna de rodada
│   ├── TeamPage.tsx                # Perfil de seleção (callout + formação + jogos)
│   ├── PlayerPage.tsx              # Perfil de jogador
│   ├── PlayerModal.tsx             # Modal de jogador
│   ├── FootballPitch.tsx           # Campo tático interativo
│   ├── PlayerSearchView.tsx        # /busca
│   ├── RankingsView.tsx            # /destaques
│   ├── PlayerComparatorView.tsx    # /comparar
│   ├── MyTeamView.tsx              # /minha-selecao
│   ├── ConfirmModal.tsx            # Modal de confirmação
│   ├── Header.tsx                  # Cabeçalho com toggle de tema
│   └── TabNav.tsx                  # Tabs
├── data/
│   ├── groups.ts                   # 48 seleções em 12 grupos
│   ├── matches.ts                  # 104 fixtures oficiais (FIFA, mar/2026)
│   ├── bracket.ts                  # Chaveamento do simulador
│   ├── playerPhotos.ts             # Fotos reais (gerado por script)
│   └── teams/                      # Dados por grupo (elenco, comissão)
├── types/
│   └── index.ts                    # Team, Group, BracketTeam, BracketMatch, Round, Fixture, Player, Formation, TeamDetail
├── utils/
│   ├── matchDate.ts                # Helpers Fixture
│   ├── bracketUtils.ts             # BFS dependentes, deriveRounds
│   ├── playerSearch.ts             # Busca
│   ├── playerStats.ts              # Avatares, gradientes
│   ├── playerRankings.ts           # Overall, ranking
│   ├── myTeamStorage.ts            # localStorage
│   ├── slug.ts                     # Slug helpers
│   └── theme.ts                    # Tokens de cor
└── index.css                       # Tailwind base

scripts/
└── fetch-avatars.mjs               # Busca fotos reais (Wikidata → Wikipedia → TSDB → Google)
```

---

## Dados

- **Calendário:** FIFA oficial, publicado em 30/mar/2026. 104 jogos (72 grupos + 32 mata-mata), horários convertidos para BRT.
- **Sorteio:** real, realizado em dezembro de 2025 (fonte: FIFA / Wikipedia).
- **Resultados:** zerados — Copa começa em 11 de junho de 2026.
- **Bracket do simulador:** projeção; confrontos reais só definidos após a fase de grupos.
- **Elencos:** dados ilustrativos estimados.

### Correções aplicadas vs fonte FIFA

A página oficial da FIFA tinha 3 datilografias que corrigimos em `src/data/matches.ts`:
1. "21 de janeiro" → "21 de junho" (rodada 2, grupo H)
2. "22 de janeiro" → "22 de junho" (rodada 2, grupo J)
3. Jogo Argentina × Jordânia: data BRT 28/06 → 27/06 (MD3 termina em 27/06)

---

## Decisões técnicas relevantes

- **Tailwind v3** fixado (v4 tem breaking changes).
- **Sem Context/Store global** — dados 100% estáticos, sem re-renders.
- **Tuple `[Team, Team, Team, Team]`** garante 4 times por grupo em compile-time.
- **Reset em cascata via BFS** ao alterar vencedor no bracket.
- **`Fixture` (single source of truth)** substituiu `team.games` — `getTeamMatches(slug)` / `getGroupMatches(group)` derivam tudo a partir de `src/data/matches.ts`.
- **Placares e Minha Seleção** persistidos em `localStorage` (`copa2026:eliminatoria:v1`, `copa2026:myTeam:v1`).
- **`navigator.clipboard`** requer contexto seguro (HTTPS ou localhost).
- **Tema dark/light manual** — `prefers-color-scheme` do SO é ignorado.
- **Fuso BRT fixo** — não configurável.

---

## Status

```
Build:  ✅ limpo
Lint:   ✅ zero erros
Testes: — (POC, sem cobertura automatizada)
```

---

*POC desenvolvida com [OpenCode](https://opencode.ai) + Serena MCP.*
