# Decision Suggestions — Copa 2026

## Sugestão 1
- **Título:** dark-variants-checklist
- **Recomendação:** Criar um comentário/padrão nos novos componentes para lembrar de adicionar `dark:` variants. Todo `bg-white`, `text-gray-900`, `border-gray-200` precisa de par `dark:`. Considerar criar um utilitário de classes ou arquivo de constantes de tema.
- **Impacto:** médio — evita regressões visuais no dark mode a cada novo componente
- **Confiança:** alta — problema já ocorreu uma vez (cards sem contraste)
- **Ação:** aplicar | ignorar

