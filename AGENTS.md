# Copa 2026 — Agent Instructions

## Stack
Vite 8 + React 19 + TypeScript 6 (strict) + Tailwind CSS v3 — SPA 100% estática, sem backend.
Leia as memories do Serena para contexto completo do projeto antes de começar qualquer tarefa.

---

## Skills disponíveis

As skills abaixo estão instaladas em `.agents/skills/`. Ative-as nas situações descritas:

### `frontend-design`
**Quando usar:** criação ou refatoração de componentes visuais — novas páginas, cards, layouts, posters, UI de alta fidelidade, qualquer trabalho que envolva aparência e estética.

### `tailwind-design-system`
**Quando usar:** trabalho com tokens de design, paleta de cores, tipografia, espaçamentos, dark mode, ou quando precisar garantir consistência visual entre componentes via Tailwind.

### `vercel-react-best-practices`
**Quando usar:** escrita, revisão ou refatoração de componentes React/TypeScript — hooks, performance, memoization, patterns de composição, evitar re-renders desnecessários.

### `webapp-testing`
**Quando usar:** verificar comportamento visual ou funcional no browser, capturar screenshots, depurar UI, testar fluxos de navegação localmente via Playwright.

---

## Regras gerais

- Idioma da UI: **PT-BR** — todo texto visível ao usuário deve estar em português do Brasil.
- Build deve passar sem erros e sem warnings: `npm run build && npm run lint`.
- Todos os hooks React devem ser declarados **antes** de qualquer `return` antecipado (rules-of-hooks).
- Não criar arquivos desnecessários — preferir editar os existentes.
- Não usar bibliotecas de animação externas — CSS puro ou Tailwind.
