/**
 * Helpers de URL para a API pública da ESPN.
 *
 * As chamadas de CONTEÚDO pedem PT-BR (`lang=pt&region=br`) — a ESPN devolve
 * manchetes, narração e textos em português.
 *
 * ⚠️ NÃO usar onde a lógica depende de códigos da ESPN, pois `lang=pt` os
 * LOCALIZA e quebra o casamento:
 *   - `team.abbreviation` (código FIFA): NED→HOL, GER→ALE, CIV→CDM… → quebra
 *     scoreboard (useLiveScores/useTournamentLeaders) e standings
 *     (useStandings) → some placar ao vivo + botão de detalhes;
 *   - `position.abbreviation`: CD-L→ZE, AM→MA… → quebra o mapeamento
 *     posição→coordenada da formação (useTeamLineup/useTeamProfile).
 *
 * Esses endpoints exibem texto do nosso data local, então não perdem nada em
 * inglês. Em uso hoje só em: notícias e narração do jogo (useMatchDetails, que
 * casa por id/nome e usa a posição apenas como texto).
 */

/** Parâmetros de idioma/região aplicados a toda chamada da ESPN. */
export const ESPN_LANG = 'lang=pt&region=br';

/** Acrescenta lang/region a uma URL da ESPN, escolhendo `?` ou `&` conforme já haja query. */
export function withEspnLang(url: string): string {
  return url + (url.includes('?') ? '&' : '?') + ESPN_LANG;
}
