import { useState } from 'react';
import type { BracketTeam } from '../types';
import { ROUNDS } from '../data/bracket';
import { RoundColumn } from './RoundColumn';
import {
  buildMatchIndex,
  collectDependents,
  deriveRounds,
  buildBracketColumns,
  COLUMN_LAYOUT_PRESETS,
  COLUMN_MATCH_OFFSETS,
} from '../utils/bracketUtils';

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
    <section className="px-2 md:px-4 py-4 md:py-5">
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 dark:text-amber-200 dark:bg-amber-900/30 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
        ⚠ Projeção — confrontos sujeitos a alteração após fase de grupos (jul/2026).
        Clique em um time para avançá-lo na chave.
      </p>
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 w-max mx-auto">
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
