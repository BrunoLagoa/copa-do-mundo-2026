# Quality Metrics — Copa 2026

## Snapshot atual

- Execuções: 8
- Taxa aprovação: 100%
- Taxa reprovação: 0%
- Retrabalho médio: 0.6 (pequenas correções por iteração)
- Principal risco: regressão de dark mode ao adicionar novos componentes sem `dark:` variants
- Tendência: estável

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

## Padrões observados
- Lint captura erros menores (unused var, hooks order) antes do deploy — pipeline funciona
- Dark mode é área de risco: novos componentes precisam checar `dark:` variants
- Build sempre passa após correção — sem regressões acumuladas
