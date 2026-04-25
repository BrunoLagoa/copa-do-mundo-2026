# Decision Suggestions — Copa 2026

## Sugestão 1
- **Título:** dark-variants-checklist
- **Recomendação:** Criar um comentário/padrão nos novos componentes para lembrar de adicionar `dark:` variants. Todo `bg-white`, `text-gray-900`, `border-gray-200` precisa de par `dark:`. Considerar criar um utilitário de classes ou arquivo de constantes de tema.
- **Impacto:** médio — evita regressões visuais no dark mode a cada novo componente
- **Confiança:** alta — problema já ocorreu uma vez (cards sem contraste)
- **Ação:** aplicar | ignorar

## Sugestão 2
- **Título:** slug-deduplication
- **Recomendação:** Corrigir a duplicação do slug `mexico` entre `grupo-a.ts` e `grupo-l.ts`. O `TEAMS_BY_SLUG` sobrescreve silenciosamente uma das entradas, podendo exibir dados errados para o México.
- **Impacto:** alto — dados incorretos para o usuário
- **Confiança:** alta — bug confirmado no código
- **Ação:** aplicar | ignorar
