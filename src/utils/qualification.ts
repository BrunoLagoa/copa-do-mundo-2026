/**
 * Cenário de classificação (top-2) de cada seleção, a partir da classificação
 * ao vivo. Usa LIMITES MATEMÁTICOS rigorosos sobre pontos — nunca afirma algo
 * que os resultados restantes possam desmentir (na dúvida, fica em "disputa").
 * Não inventa saldo de gols: por isso é conservador, nunca incorreto.
 */

import type { StandingRow } from '../hooks/useStandings';

export type QualStatus = 'qualified' | 'contention' | 'eliminated';

export interface TeamScenario {
  status: QualStatus;
  maxPoints: number;
  gamesLeft: number;
}

const GROUP_GAMES = 3; // cada seleção joga 3 na fase de grupos

export function groupScenarios(rows: StandingRow[]): Record<string, TeamScenario> {
  const teams = rows.map((r) => {
    const left = Math.max(0, GROUP_GAMES - r.played);
    return { r, left, max: r.points + 3 * left };
  });
  const decided = teams.every((t) => t.left === 0);
  const out: Record<string, TeamScenario> = {};

  for (const t of teams) {
    const others = teams.filter((o) => o.r.code !== t.r.code);
    let status: QualStatus;
    if (decided) {
      // Grupo encerrado → rank oficial da ESPN resolve qualquer empate.
      status = t.r.rank <= 2 ? 'qualified' : 'eliminated';
    } else {
      // Quantos outros ainda podem alcançar/passar meus pontos atuais?
      const canReachMe = others.filter((o) => o.max >= t.r.points).length;
      // Quantos já têm mais pontos do que meu teto máximo?
      const aboveMyCeiling = others.filter((o) => o.r.points > t.max).length;
      if (t.r.advanced || canReachMe <= 1) status = 'qualified';
      else if (aboveMyCeiling >= 2) status = 'eliminated';
      else status = 'contention';
    }
    out[t.r.code] = { status, maxPoints: t.max, gamesLeft: t.left };
  }
  return out;
}
