# Quality Metrics — Copa 2026

## Snapshot atual

- Execuções: 19
- Taxa aprovação: 95% (18/19 aprovados; exec 17 com ressalvas)
- Taxa reprovação: 0%
- Retrabalho médio: 0.36
- Principal risco: dark mode em novos componentes sem `dark:` variants
- Tendência: melhorando

## Histórico de execuções

| # | Tarefa | Resultado | Retrabalho |
|---|---|---|---|
| 1 | Formação tática (FootballPitch) | Aprovado | 0 |
| 2 | PlayerModal + PlayerPage | Aprovado | 1 (hooks rules-of-hooks) |
| 3 | animate-ui ThemeToggler | Aprovado | 1 (lint unused var) |
| 4 | Correção toggle dark mode + ícones | Aprovado | 0 |
| 5 | Avatar cortado no modal | Aprovado | 0 |
| 6 | Padding TeamPage | Aprovado | 0 |
| 7 | Escala de cores dark/light | Aprovado | 0 |
| 8 | Memory save | — | — |
| 9 | Aba Eliminatórias + EliminatoriaView + ScoreMatchCard | Aprovado | 0 |
| 10 | Correção nome "Eliminatória" → "Eliminatórias" | Aprovado | 0 |
| 11 | GitHub Pages config (vite base, 404.html, workflow) | Aprovado | 0 |
| 12 | Fix hooks bug PlayerPage (usePlayerPhoto antes do guard) | Aprovado | 0 |
| 13 | Extração bracketUtils.ts + refactor BracketView + KnockoutView | Aprovado | 0 |
| 14 | Remoção fetchPlayerPhoto/usePlayerPhoto → DiceBear-only | Aprovado | 0 |
| 15 | Ajuste fundo campo: bg-zinc-900 → bg-gray-50 / dark:bg-[#121728] | Aprovado | 0 |
| 16 | Cores de texto FootballPitch (title/footer) para dark-aware | Aprovado | 0 |
| 17 | Drag & drop jogadores no FootballPitch (Pointer Events API) | Aprovado c/ ressalvas | 1 (hooks após early return) |
| 18 | Correção coordenadas drag (delta incremental + getBoundingClientRect) + remoção handler duplo | Aprovado | 0 |
| 19 | Select dinâmico de formação em TeamPage + expansão Formation para 12 formações + ALL_FORMATIONS | Aprovado | 0 |

## Padrões observados
- Lint captura erros menores (unused var, hooks order) antes do deploy — pipeline funciona
- Dark mode é área de risco: novos componentes precisam checar `dark:` variants
- Build sempre passa após correção — sem regressões acumuladas
- Refatorações de código puro (sem mudança visual) têm retrabalho zero consistentemente
- Remoção de integrações externas reduz risco sem custo visual
- CSS 3D no SVG: `getScreenCTM()` não enxerga `rotateX` CSS — usar **deltas incrementais + `getBoundingClientRect()`** para drag em SVG com perspectiva CSS. Padrão validado e aplicado.
