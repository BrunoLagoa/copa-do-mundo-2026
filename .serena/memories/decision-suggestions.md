# Decision Suggestions — Copa 2026

## Sugestão 2
- **Título:** pitch-drag-handler-cleanup
- **Recomendação:** Remover `onPointerUp` do `<g>` de cada jogador em `FootballPitch.tsx` — o handler está duplicado: existe no `<g>` e no `<svg>` pai. Como `setPointerCapture` está ativo, o `pointerup` sempre chega ao `<svg>`. O handler no `<g>` é redundante e pode causar double-fire em edge cases. Centralizar apenas no `<svg>`.
- **Impacto:** baixo — guards protegem, mas é tech debt claro
- **Confiança:** alta — identificado em review-code sessão 3
- **Ação:** aplicar | ignorar

## Sugestão 3
- **Título:** pitch-drag-coords-validation
- **Recomendação:** Validar no browser se `getScreenCTM().inverse()` retorna coordenadas corretas com `rotateX(28deg)` no wrapper CSS. Se houver desvio visual entre cursor e jogador durante drag, aplicar correção: remover `rotateX` temporariamente durante o drag (via estado React + classe CSS no wrapper) e restaurar no `pointerUp`. Não implementar antes de confirmar o problema.
- **Impacto:** alto — se houver desvio, a feature de drag é inutilizável
- **Confiança:** média — risco teórico confirmado por spec da API, mas comportamento real depende do browser
- **Ação:** aplicar | ignorar

## Sugestão 1
- **Título:** dark-variants-checklist
- **Recomendação:** Criar um comentário/padrão nos novos componentes para lembrar de adicionar `dark:` variants. Todo `bg-white`, `text-gray-900`, `border-gray-200` precisa de par `dark:`. Considerar criar um utilitário de classes ou arquivo de constantes de tema.
- **Impacto:** médio — evita regressões visuais no dark mode a cada novo componente
- **Confiança:** alta — problema já ocorreu uma vez (cards sem contraste)
- **Ação:** aplicar | ignorar

