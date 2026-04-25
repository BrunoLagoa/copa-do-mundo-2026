import { useState } from 'react';
import type { BracketTeam, Match, Round } from '../types';
import { ROUNDS } from '../data/bracket';
import { RoundColumn } from './RoundColumn';

// Build a lookup: matchId → Match (across all rounds)
function buildMatchIndex(rounds: Round[]): Record<string, Match> {
  const index: Record<string, Match> = {};
  for (const round of rounds) {
    for (const match of round.matches) {
      index[match.id] = match;
    }
  }
  return index;
}

// Collect all matchIds that are downstream of a given matchId (inclusive)
function collectDependents(startMatchId: string, matchIndex: Record<string, Match>): string[] {
  const result: string[] = [];
  const queue = [startMatchId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    result.push(id);
    const match = matchIndex[id];
    if (match?.next) {
      queue.push(match.next.matchId);
    }
  }
  return result;
}

// Derive effective rounds: fill QF/SF/Final slots from winners map
function deriveRounds(rounds: Round[], winners: Record<string, BracketTeam>): Round[] {
  // Build a map: nextMatchId+slot → winning team
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

// Arrange columns in mirrored layout with the final centered:
// Oitavas | Quartas | Semifinal | Final | Semifinal | Quartas | Oitavas
function buildBracketColumns(rounds: Round[]): Round[] {
  const byId = Object.fromEntries(rounds.map((round) => [round.id, round])) as Record<string, Round | undefined>;

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

const COLUMN_LAYOUT_PRESETS = [
  { topOffset: 'pt-0', gap: 'gap-3' },
  { topOffset: 'pt-14 md:pt-16', gap: 'gap-14 md:gap-16' },
  { topOffset: 'pt-52 md:pt-60', gap: 'gap-3' },
  { topOffset: 'pt-52 md:pt-60', gap: 'gap-3' },
  { topOffset: 'pt-52 md:pt-60', gap: 'gap-3' },
  { topOffset: 'pt-14 md:pt-16', gap: 'gap-14 md:gap-16' },
  { topOffset: 'pt-0', gap: 'gap-3' },
] as const;

const COLUMN_MATCH_OFFSETS = [
  [],
  ['', 'mt-24 md:mt-28'],
  [],
  [],
  [],
  ['', 'mt-24 md:mt-28'],
  [],
] as const;

const MATCH_INDEX = buildMatchIndex(ROUNDS);

export function BracketView() {
  const [winners, setWinners] = useState<Record<string, BracketTeam>>({});

  function handleSelectWinner(matchId: string, team: BracketTeam) {
    setWinners((prev) => {
      const next = { ...prev };

      // If same winner clicked again, deselect
      if (next[matchId]?.name === team.name) {
        const toRemove = collectDependents(matchId, MATCH_INDEX);
        for (const id of toRemove) delete next[id];
        return next;
      }

      // Set winner, then reset all downstream (not the match itself)
      const dependents = collectDependents(matchId, MATCH_INDEX);
      // Remove dependents excluding the match itself (we'll set it below)
      for (const id of dependents) {
        if (id !== matchId) delete next[id];
      }
      next[matchId] = team;
      return next;
    });
  }

  const derivedRounds = deriveRounds(ROUNDS, winners);
  const displayColumns = buildBracketColumns(derivedRounds);

  return (
    <section className="p-4 md:p-6">
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-200 dark:bg-amber-900/30 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
        ⚠ Projeção — confrontos sujeitos a alteração após fase de grupos (jul/2026).
        Clique em um time para avançá-lo na chave.
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {displayColumns.map((round, index) => (
            <RoundColumn
              key={round.id}
              round={round}
              winners={winners}
              onSelectWinner={handleSelectWinner}
              topOffsetClassName={COLUMN_LAYOUT_PRESETS[index]?.topOffset}
              matchesGapClassName={COLUMN_LAYOUT_PRESETS[index]?.gap}
              matchOffsetClassNames={[...(COLUMN_MATCH_OFFSETS[index] ?? [])]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
