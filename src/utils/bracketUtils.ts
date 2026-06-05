import type { BracketTeam, BracketMatch, Round } from '../types';

/** Build a lookup: matchId → BracketMatch (across all rounds) */
export function buildMatchIndex(rounds: Round[]): Record<string, BracketMatch> {
  const index: Record<string, BracketMatch> = {};
  for (const round of rounds) {
    for (const match of round.matches) {
      index[match.id] = match;
    }
  }
  return index;
}

/** Collect all matchIds that are downstream of a given matchId (inclusive) */
export function collectDependents(
  startMatchId: string,
  matchIndex: Record<string, BracketMatch>,
): string[] {
  const result: string[] = [];
  const queue = [startMatchId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    const match = matchIndex[id];
    if (match?.next) queue.push(match.next.matchId);
  }
  return result;
}

/** Derive effective rounds: fill QF/SF/Final slots from winners map */
export function deriveRounds(
  rounds: Round[],
  winners: Record<string, BracketTeam>,
): Round[] {
  const slotMap: Record<string, BracketTeam> = {};
  for (const round of rounds) {
    for (const match of round.matches) {
      const winner = winners[match.id];
      if (winner && match.next) {
        const key = `${match.next.matchId}:${match.next.slot}`;
        slotMap[key] = winner;
      }
    }
  }
  return rounds.map((round) => ({
    ...round,
    matches: round.matches.map((match) => ({
      ...match,
      teamA: slotMap[`${match.id}:teamA`] ?? match.teamA,
      teamB: slotMap[`${match.id}:teamB`] ?? match.teamB,
    })),
  }));
}

/**
 * Arranja 9 colunas com layout espelhado:
 *   ro32-left → ro16-left → qf-left → sf-left → FINAL ← sf-right ← qf-right ← ro16-right ← ro32-right
 */
export function buildBracketColumns(rounds: Round[]): Round[] {
  const byId = Object.fromEntries(rounds.map((r) => [r.id, r])) as Record<string, Round | undefined>;
  const ro32 = byId.ro32;
  const ro16 = byId.ro16;
  const qf = byId.qf;
  const sf = byId.sf;
  const final = byId.final;
  if (!ro32 || !ro16 || !qf || !sf || !final) return rounds;

  return [
    { id: 'ro32-left',  label: ro32.label,  matches: ro32.matches.slice(0, 8) },
    { id: 'ro16-left',  label: ro16.label,  matches: ro16.matches.slice(0, 4) },
    { id: 'qf-left',    label: qf.label,    matches: qf.matches.slice(0, 2) },
    { id: 'sf-left',    label: sf.label,    matches: sf.matches.slice(0, 1) },
    { id: 'final-center', label: final.label, matches: final.matches },
    { id: 'sf-right',   label: sf.label,    matches: sf.matches.slice(1, 2) },
    { id: 'qf-right',   label: qf.label,    matches: qf.matches.slice(2, 4) },
    { id: 'ro16-right', label: ro16.label,  matches: ro16.matches.slice(4, 8) },
    { id: 'ro32-right', label: ro32.label,  matches: ro32.matches.slice(8, 16) },
  ];
}

export const COLUMN_LAYOUT_PRESETS = [
  // ro32-left
  { topOffset: 'pt-0', gap: 'gap-1' },
  // ro16-left
  { topOffset: 'pt-24 md:pt-28', gap: 'gap-6 md:gap-6' },
  // qf-left
  { topOffset: 'pt-60 md:pt-72', gap: 'gap-14 md:gap-16' },
  // sf-left
  { topOffset: 'pt-96 md:pt-112', gap: 'gap-3' },
  // final-center
  { topOffset: 'pt-88 md:pt-104', gap: 'gap-3' },
  // sf-right
  { topOffset: 'pt-96 md:pt-112', gap: 'gap-3' },
  // qf-right
  { topOffset: 'pt-60 md:pt-72', gap: 'gap-14 md:gap-16' },
  // ro16-right
  { topOffset: 'pt-24 md:pt-28', gap: 'gap-6 md:gap-6' },
  // ro32-right
  { topOffset: 'pt-0', gap: 'gap-1' },
] as const;

export const COLUMN_MATCH_OFFSETS = [
  // ro32-left (8 matches)
  [],
  // ro16-left (4)
  ['', 'mt-28 md:mt-32', '', 'mt-28 md:mt-32'],
  // qf-left (2)
  ['', 'mt-28 md:mt-32'],
  // sf-left (1)
  [],
  // final (1)
  [],
  // sf-right (1)
  [],
  // qf-right (2)
  ['', 'mt-28 md:mt-32'],
  // ro16-right (4)
  ['', 'mt-28 md:mt-32', '', 'mt-28 md:mt-32'],
  // ro32-right (8)
  [],
] as const;
