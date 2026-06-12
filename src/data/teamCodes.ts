/**
 * Mapa slug → código FIFA de 3 letras.
 *
 * Usado para casar um jogo vindo da API de placares ao vivo (que identifica
 * seleções por código/sigla, não pelo nosso slug PT-BR) com um fixture local
 * (M1…M104). O casamento é feito por data BRT + par de códigos {casa, fora}.
 *
 * Códigos seguem a convenção FIFA/IOC de 3 letras. A football-data.org expõe
 * isso no campo `tla` de cada time; a maioria coincide. Quando um provedor usa
 * sigla divergente, o casamento simplesmente não ocorre para aquele jogo (o app
 * cai no comportamento normal — placar manual), sem quebrar nada.
 */

/** slug (homeSlug/awaySlug em FIXTURES) → código FIFA de 3 letras. */
export const TEAM_CODE_BY_SLUG: Record<string, string> = {
  'africa-do-sul': 'RSA',
  alemanha: 'GER',
  'arabia-saudita': 'KSA',
  argelia: 'ALG',
  argentina: 'ARG',
  australia: 'AUS',
  austria: 'AUT',
  belgica: 'BEL',
  'bosnia-herzegovina': 'BIH',
  brasil: 'BRA',
  'cabo-verde': 'CPV',
  canada: 'CAN',
  catar: 'QAT',
  colombia: 'COL',
  'coreia-do-sul': 'KOR',
  'costa-do-marfim': 'CIV',
  croacia: 'CRO',
  curacao: 'CUW',
  egito: 'EGY',
  equador: 'ECU',
  escocia: 'SCO',
  espanha: 'ESP',
  eua: 'USA',
  franca: 'FRA',
  gana: 'GHA',
  haiti: 'HAI',
  holanda: 'NED',
  inglaterra: 'ENG',
  ira: 'IRN',
  iraque: 'IRQ',
  japao: 'JPN',
  jordania: 'JOR',
  marrocos: 'MAR',
  mexico: 'MEX',
  noruega: 'NOR',
  'nova-zelandia': 'NZL',
  panama: 'PAN',
  paraguai: 'PAR',
  portugal: 'POR',
  'rep-dem-congo': 'COD',
  'republica-checa': 'CZE',
  senegal: 'SEN',
  suecia: 'SWE',
  suica: 'SUI',
  tunisia: 'TUN',
  turquia: 'TUR',
  uruguai: 'URU',
  uzbequistao: 'UZB',
};

export function codeForSlug(slug: string): string | null {
  return TEAM_CODE_BY_SLUG[slug] ?? null;
}
