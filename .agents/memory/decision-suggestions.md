# decision-suggestions.md — Sugestões de decisão

> Gerado automaticamente via `/memory-save`.
> Máximo: 5 sugestões ativas. Ordenadas por confiança + impacto.
> Última atualização: 2026-04-26 (sessão 4)

---

## [S1] Executar `/review-code` em todo o código acumulado

**Confiança:** Alta
**Impacto:** Alto
**Contexto:** Acumulado de 4 sessões sem `/review-code` formal. Pontos de atenção atuais: acessibilidade dos botões de time (aria-labels), semântica HTML do bracket, comportamento em telas < 320px, edge case de placeholders de mata-mata, validação do single source of truth (`Fixture` × `MatchEntry`), e `navigator.clipboard` em contextos sem HTTPS.
**Sugestão:** Executar `/review-code` cobrindo todo o código novo desde a sessão 2 (bracket + score + team.detail games removal + fixtures + GroupSchedule + NextMatchCallout + GamesView enrichment).
**Ação:** `/review-code` como próximo passo prioritário.

---

## [S2] Validar visualmente com Playwright (`webapp-testing` skill)

**Confiança:** Alta
**Impacto:** Médio
**Contexto:** `webapp-testing` está disponível em `.agents/skills/` mas não foi usado em nenhuma das 4 execuções. Sessão 4 introduziu 3 superfícies novas (GamesView enriquecido, GroupCard com 3 jogos, TeamPage callout) que precisam de validação visual desktop + mobile + dark mode. A regressão em 1 desses fluxos seria invisível até um usuário reportar.
**Sugestão:** Adicionar step de captura de screenshots em `/review` ou criar comando auxiliar que rode Playwright contra as 4 rotas principais (`/grupos`, `/jogos`, `/team/brasil`, `/bracket`) em viewports 360×640 e 1280×800, em ambos os temas.
**Ação:** Carregar `webapp-testing` skill antes do próximo `/review` ou `/review-code`.

---

## [S3] Adicionar testes automatizados para `FIXTURES` (snapshot test)

**Confiança:** Média
**Impacto:** Médio
**Contexto:** `src/data/matches.ts` é a single source of truth de 104 entradas críticas. Erro humano (typo, data trocada, horário errado) só é pego por revisão manual. Hoje qualquer um pode editar `FIXTURES` e quebrar UI sem alarme.
**Sugestão:** Adicionar Vitest com snapshot test de `FIXTURES` que detecta mudanças (ex: alguém removendo M50) e valida invariantes: total = 104, M1–M72 são `phase: 'group'`, M73–M88 são `round-of-32`, etc.
**Ação:** Avaliar quando promover de POC para projeto mantido.

---

## [S4] Manter memórias `.agents/memory/*` em sincronia com o código

**Confiança:** Alta
**Impacto:** Alto
**Contexto:** Na sessão 4, a memória carregada por `/context` estava significativamente desatualizada (não documentava `KnockoutView`, `MyTeamView`, `PlayerComparatorView`, `PlayerSearchView`, `RankingsView`, e o uso de `team.games`). Quem segue a memória cegamente toma decisões baseadas em premissas falsas. Serena foi o "salva-vidas" ao revelar a verdade via código.
**Sugestão:** Adicionar `/memory-save` automático ao final de CADA sessão significativa (não apenas no fim do `/execute`). Adicionalmente, considerar uma etapa de "verificar consistência da memória" no início de `/context` que compare nomes de arquivos da memória com `list_dir` real e sinalize drift.
**Ação:** Revisar protocolo de `/memory-save` e adicionar passo de validação em `/context`.

---

## [S5] Considerar code-splitting de `GamesView`/`KnockoutView`/`BracketView` (bundle > 500 kB)

**Confiança:** Média
**Impacto:** Baixo
**Contexto:** Bundle de 582.18 kB (151 kB gzipped) aciona warning do Vite. Os 3 views maiores (GamesView com 104 cards, KnockoutView, BracketView) representam ~30% do bundle mas só são acessados por 1 rota cada. Code-splitting com `React.lazy` reduziria o initial load significativamente sem complexidade adicional.
**Sugestão:** Adiar para depois que o projeto sair de POC. Manter registro para acompanhamento.
**Ação:** Reavaliar quando sair de POC.
