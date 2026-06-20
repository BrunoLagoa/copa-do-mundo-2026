/**
 * Helpers de URL para a API pública da ESPN.
 *
 * Todas as chamadas pedem conteúdo em PT-BR (`lang=pt&region=br`) — a ESPN
 * devolve manchetes, nomes e textos em português para esse par.
 */

/** Parâmetros de idioma/região aplicados a toda chamada da ESPN. */
export const ESPN_LANG = 'lang=pt&region=br';

/** Acrescenta lang/region a uma URL da ESPN, escolhendo `?` ou `&` conforme já haja query. */
export function withEspnLang(url: string): string {
  return url + (url.includes('?') ? '&' : '?') + ESPN_LANG;
}
