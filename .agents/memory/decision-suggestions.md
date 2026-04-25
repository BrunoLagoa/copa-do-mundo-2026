# decision-suggestions.md — Sugestões de decisão

> Gerado automaticamente via `/memory-save`.
> Máximo: 5 sugestões ativas. Ordenadas por confiança + impacto.
> Última atualização: 2026-04-24 (sessão 3)

---

## [S1] Executar /review-code no bracket interativo e melhorias da sessão 3

**Confiança:** Alta
**Impacto:** Alto
**Contexto:** O bracket interativo (`BracketView`, `MatchCard`, `RoundColumn`) foi implementado e build passa. As melhorias da sessão 3 (`PlayerPage` tema, `App.tsx` busca, botão copiar) também não passaram por `/review-code`. Pontos de atenção: acessibilidade dos botões de time (aria-labels), semântica HTML do bracket, comportamento em telas < 320px, edge case de times com mesmo nome em grupos diferentes, e `navigator.clipboard` em contextos sem HTTPS.
**Sugestão:** Executar `/review-code` para garantir qualidade técnica profunda antes de qualquer nova feature.
**Ação:** `/review-code` como próximo passo.

---

## [S2] Atualizar prd.md e spec.md com fase eliminatória e melhorias

**Confiança:** Alta
**Impacto:** Médio
**Contexto:** `prd.md` lista "Fase eliminatória / chaveamento" como Non-Goal. `spec.md` não documenta os novos tipos (`BracketTeam`, `Match`, `Round`, `Player`, `TeamGame`) nem os novos componentes (`FootballPitch`, `PlayerModal`, `PlayerPage`, `TeamPage`). Ambos estão desatualizados após as sessões 2 e 3.
**Sugestão:** Atualizar `prd.md` (remover Non-Goal, adicionar Goal) e `spec.md` (adicionar seção de tipos do bracket, componentes e decisões de tema/busca).
**Ação:** Editar `prd.md` §Goals/Non-Goals e `spec.md` §Tipos e §Componentes.

---

## [S3] Adicionar README.md com instruções do projeto

**Confiança:** Alta
**Impacto:** Baixo
**Contexto:** O `README.md` atual é o padrão gerado pelo Vite (`# Vite + React + TypeScript`). Não descreve o projeto, funcionalidades, estrutura ou como rodar.
**Sugestão:** Atualizar com: nome do projeto, objetivo, como rodar (`npm run dev`), estrutura de arquivos, fonte dos dados e funcionalidades disponíveis (grupos, bracket, busca, perfil de jogador).
**Ação:** Editar `README.md`.

---

## [S4] Fixar versões no package.json com ranges exatos

**Confiança:** Média
**Impacto:** Médio
**Contexto:** `package.json` usa ranges com `^` (ex: `"react": "^19.2.5"`). Em uma POC isso é aceitável, mas se o projeto crescer, um `npm install` futuro pode instalar versões incompatíveis.
**Sugestão:** Considerar usar `--save-exact` ou fixar versões sem `^` para dependências críticas (`react`, `react-dom`, `tailwindcss`).
**Ação:** Avaliar ao promover de POC para projeto mantido.

---

## [S5] Adicionar aviso visual mais proeminente sobre dados do bracket

**Confiança:** Média
**Impacto:** Baixo
**Contexto:** O bracket atual usa dados projetados (não oficiais). Um aviso de texto pequeno existe em `BracketView`, mas pode passar despercebido. Os confrontos reais só serão definidos após a fase de grupos (jul/2026).
**Sugestão:** Avaliar se o aviso atual (banner amarelo no topo do bracket) é suficiente ou se deve ser mais destacado — especialmente se o projeto for publicado.
**Ação:** Decisão de UX/produto — sem urgência técnica.
