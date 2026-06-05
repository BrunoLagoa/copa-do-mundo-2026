# Copa do Mundo 2026 — PRD

> Produto: SPA estática de acompanhamento da Copa do Mundo FIFA 2026.
> Última atualização: 2026-04 (sessão de horários).

## Visão

Tabela interativa da Copa do Mundo 2026: 48 seleções, 12 grupos, 104 jogos (72 grupos + 32 mata-mata), em três países-sede. Foco no público brasileiro — idioma PT-BR, horários BRT, estádios e cidades.

## Objetivos

1. **Listar 12 grupos** (4 seleções cada) com bandeiras, países-sede destacados.
2. **Mostrar fase eliminatória** (32-avos → Final) com 2 modos:
   - **Eliminatórias** — input de placar real, pênaltis, propagação de vencedor.
   - **Simulador (bracket)** — clique para escolher vencedor (simulação livre).
3. **Exibir calendário oficial** com data, **horário BRT**, cidade e estádio.
4. **Buscar seleção** por nome (client-side, sem backend).
5. **Página por seleção**: elenco, formação tática, comissão técnica, jogos (com horário), confederacao.
6. **Perfil por jogador**: posição, clube, número, navegação entre elencos.
7. **Busca de jogadores** cross-seleção.
8. **Destaques** (rankings de jogadores por posição e overall).
9. **Comparador** de dois jogadores.
10. **Minha Seleção** — 11 slots, formação customizável, persistência em `localStorage`.

## Não-objetivos (Non-Goals)

- ❌ Backend / API externa / persistência server-side.
- ❌ Autenticação de usuários.
- ❌ Notificações push / countdown para próximos jogos.
- ❌ Integração com placares reais em tempo real.
- ❌ Localização em outros idiomas (espanhol, inglês).
- ❌ Fuso-horário configurável — BRT é fixo.

## Funcionalidades — matriz

| Feature | Rota | Status |
|---|---|---|
| Grupos | `/grupos` | ✅ |
| Eliminatórias (placar real) | `/knockout` | ✅ |
| Simulador (bracket livre) | `/bracket` | ✅ |
| Calendário de jogos | `/jogos` | ✅ (com horário BRT, mar/2026) |
| Brasil (atalho) | `/team/brasil` | ✅ |
| Busca de jogadores | `/busca` | ✅ |
| Destaques | `/destaques` | ✅ |
| Comparar | `/comparar` | ✅ |
| Minha Seleção | `/minha-selecao` | ✅ |
| Página de seleção | `/team/:slug` | ✅ |
| Página de jogador | `/player/:teamSlug/:playerNumber` | ✅ |

## Convenções

- **Idioma:** PT-BR. Nomes de seleções: "Holanda", "Curaçao", "Bósnia-Herzegovina", "Rep. Dem. Congo", "EUA" (não os nomes da FIFA literal).
- **Fuso:** BRT (UTC-3) como horário exibido. FIFA publica horário local; conversão é feita em `src/data/matches.ts`.
- **Dados:** 100% estáticos. `src/data/matches.ts` contém 104 fixtures oficiais. `src/data/teams/grupo-{a..l}.ts` contém elenco e comissão técnica.
- **Tema:** dark/light manual (toggle no header), persistido em `localStorage` via `next-themes`.
- **Responsivo:** breakpoints `sm` (640), `md` (768), `xl` (1280).
