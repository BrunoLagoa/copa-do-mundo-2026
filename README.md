# 🏆 Copa do Mundo 2026

> 48 seleções. 12 grupos. 1 troféu.  
> Acompanhe a fase de grupos, registre os placares e monte o seu bracket da Copa FIFA 2026.

---

## Screenshots

| Grupos | Eliminatórias | Simulador |
|---|---|---|
| ![Grupos](docs/screenshot-groups.png) | ![Eliminatórias](docs/screenshot-knockout.png) | ![Simulador](docs/screenshot-bracket.png) |

---

## O que é isso?

Uma SPA interativa para explorar a Copa do Mundo 2026 — o maior torneio da história do futebol, com 48 seleções pela primeira vez. Dados do sorteio real realizado em dezembro de 2025.

Sem backend. Sem API. Sem frescura. Só futebol.

---

## Funcionalidades

| Feature | Descrição |
|---|---|
| 🗂 **Fase de grupos** | 12 grupos (A–L) com as 48 seleções classificadas |
| 🔍 **Busca** | Filtre qualquer seleção pelo nome em tempo real |
| 📋 **Eliminatórias** | Insira placar de cada confronto; vencedor avança automaticamente. Em caso de empate, escolha o vencedor nos pênaltis |
| 🏟 **Simulador** | Monte o seu chaveamento das oitavas até a final selecionando os vencedores |
| 👕 **Perfil de seleção** | Clique em qualquer time para ver elenco e resultados |
| ⚽ **Perfil de jogador** | Estatísticas individuais com foto e posição no campo |
| 🌙 **Tema dark/light** | Alterne manualmente pelo ícone no header |

---

## Como rodar

**Pré-requisito:** Node.js ≥ 18

```bash
npm install
npm run dev
```

Acesse [http://localhost:5173](http://localhost:5173)

### Outros comandos

```bash
npm run build    # build de produção (TypeScript + Vite)
npm run preview  # preview do build
npm run lint     # ESLint
```

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 |
| Linguagem | TypeScript 6 (`strict: true`) |
| Bundler | Vite 8 |
| Estilo | Tailwind CSS 3 |
| Roteamento | React Router 7 |
| Ícones | Lucide React |
| Tema | next-themes |

---

## Estrutura

```
src/
├── components/
│   ├── GroupGrid.tsx       # Grid dos 12 grupos
│   ├── GroupCard.tsx       # Card individual de grupo
│   ├── TeamRow.tsx         # Linha de seleção na tabela
│   ├── TeamPage.tsx        # Perfil da seleção
│   ├── PlayerPage.tsx      # Perfil do jogador
│   ├── PlayerModal.tsx     # Modal de jogador
│   ├── FootballPitch.tsx   # Campo interativo com posições
│   ├── KnockoutView.tsx    # Acompanhamento com placares reais
│   ├── ScoreMatchCard.tsx  # Card de confronto com entrada de placar
│   ├── BracketView.tsx     # Simulador de chaveamento eliminatório
│   ├── MatchCard.tsx       # Card de confronto
│   ├── RoundColumn.tsx     # Coluna de rodada (Oitavas/QF/SF/Final)
│   ├── Header.tsx          # Cabeçalho com toggle de tema
│   └── TabNav.tsx          # Navegação Grupos / Eliminatórias / Simulador
├── data/
│   ├── groups.ts           # 48 seleções em 12 grupos
│   ├── bracket.ts          # Chaveamento projetado das oitavas
│   └── teams/              # Dados detalhados por grupo (A–L)
├── types/
│   └── index.ts            # Interfaces TypeScript (Team, Group, Match…)
└── utils/
    ├── slug.ts             # Gerador de slugs para rotas
    ├── playerStats.ts      # Utilitários de estatísticas
    └── theme.ts            # Tokens de tema
```

---

## Dados

- **Sorteio:** real, realizado em dezembro de 2025 (fonte: FIFA / Wikipedia)
- **Resultados:** zerados — Copa começa em junho de 2026
- **Bracket:** projeção baseada nos cabeças de chave; confrontos reais definidos após fase de grupos
- **Jogadores:** dados ilustrativos para fins de demonstração

---

## Rotas

| Rota | Página |
|---|---|
| `/` | Fase de grupos |
| `/knockout` | Eliminatórias com entrada de placar |
| `/bracket` | Simulador de chaveamento |
| `/team/:slug` | Perfil da seleção |
| `/player/:teamSlug/:playerNumber` | Perfil do jogador |

---

## Decisões técnicas relevantes

- **Tailwind v3** fixado (v4 tem breaking changes)
- **Sem Context/Store** — dados 100% estáticos, sem re-renders
- **Tuple `[Team, Team, Team, Team]`** garante 4 times por grupo em compile-time
- **Reset em cascata via BFS** ao alterar vencedor no bracket
- **`navigator.clipboard`** requer contexto seguro (HTTPS ou localhost)

---

## Status

```
Build:  ✅ limpo
Lint:   ✅ zero erros
Testes: — (POC, sem cobertura automatizada)
```

---

*POC desenvolvida com [OpenCode](https://opencode.ai) + Serena MCP*
