/**
 * Mapa código FIFA (3 letras) → ID numérico do time na ESPN (liga `fifa.world`).
 *
 * Capturado uma vez de `/apis/site/v2/sports/soccer/fifa.world/teams` (48 times).
 * Combinado com `codeForSlug` permite resolver slug PT-BR → ID ESPN sem fetch
 * extra, alimentando `useTeamProfile` (elenco real, fotos, estatísticas ao vivo).
 */

import { codeForSlug } from './teamCodes';

export const ESPN_ID_BY_CODE: Record<string, string> = {
  ALG: '624', ARG: '202', AUS: '628', AUT: '474', BEL: '459', BIH: '452',
  BRA: '205', CAN: '206', CIV: '4789', COD: '2850', COL: '208', CPV: '2597',
  CRO: '477', CUW: '11678', CZE: '450', ECU: '209', EGY: '2620', ENG: '448',
  ESP: '164', FRA: '478', GER: '481', GHA: '4469', HAI: '2654', IRN: '469',
  IRQ: '4375', JOR: '2917', JPN: '627', KOR: '451', KSA: '655', MAR: '2869',
  MEX: '203', NED: '449', NOR: '464', NZL: '2666', PAN: '2659', PAR: '210',
  POR: '482', QAT: '4398', RSA: '467', SCO: '580', SEN: '654', SUI: '475',
  SWE: '466', TUN: '659', TUR: '465', URU: '212', USA: '660', UZB: '2570',
};

/** slug PT-BR (ex. "eua") → ID ESPN (ex. "660"). */
export function espnIdForSlug(slug: string): string | null {
  const code = codeForSlug(slug);
  return code ? ESPN_ID_BY_CODE[code] ?? null : null;
}
