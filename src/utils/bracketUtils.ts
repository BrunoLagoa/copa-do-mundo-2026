import type { BracketTeam, Match, Round } from '../types';

/** Build a lookup: matchId → Match (across all rounds) */
export function buildMatchIndex(rounds: Round[]): Record<string, Match> {
  const index: Record<string, Match> = {};
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
  matchIndex: Record<string, Match>,
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
 * Arrange columns in mirrored layout with the final centered:
 * Oitavas | Quartas | Semifinal | Final | Semifinal | Quartas | Oitavas
 */
export function buildBracketColumns(rounds: Round[]): Round[] {
  const byId = Object.fromEntries(rounds.map((r) => [r.id, r])) as Record<
    string,
    Round | undefined
  >;
  const ro16 = byId.ro16;
  const qf = byId.qf;
  const sf = byId.sf;
  const final = byId.final;
  if (!ro16 || !qf || !sf || !final) return rounds;
  return [
    { id: 'ro16-left', label: ro16.label, matches: ro16.matches.slice(0, 4) },
    { id: 'qf-left', label: qf.label, matches: qf.matches.slice(0, 2) },
    { id: 'sf-left', label: sf.label, matches: sf.matches.slice(0, 1) },
    { id: 'final-center', label: final.label, matches: final.matches },
    { id: 'sf-right', label: sf.label, matches: sf.matches.slice(1, 2) },
    { id: 'qf-right', label: qf.label, matches: qf.matches.slice(2, 4) },
    { id: 'ro16-right', label: ro16.label, matches: ro16.matches.slice(4, 8) },
  ];
}

export const COLUMN_LAYOUT_PRESETS = [
  { topOffset: 'pt-0', gap: 'gap-3' },
  { topOffset: 'pt-14 md:pt-16', gap: 'gap-14 md:gap-16' },
  { topOffset: 'pt-52 md:pt-60', gap: 'gap-3' },
  { topOffset: 'pt-44 md:pt-52', gap: 'gap-3' },
  { topOffset: 'pt-52 md:pt-60', gap: 'gap-3' },
  { topOffset: 'pt-14 md:pt-16', gap: 'gap-14 md:gap-16' },
  { topOffset: 'pt-0', gap: 'gap-3' },
] as const;

export const COLUMN_MATCH_OFFSETS = [
  [],
  ['', 'mt-24 md:mt-28'],
  [],
  [],
  [],
  ['', 'mt-24 md:mt-28'],
  [],
] as const;
