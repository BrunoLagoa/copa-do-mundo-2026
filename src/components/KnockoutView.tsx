import { useState, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import type { BracketTeam, Match, Round } from '../types';
import { ROUNDS } from '../data/bracket';
import { ScoreMatchCard } from './ScoreMatchCard';
import type { MatchScore } from './ScoreMatchCard';
import {
  buildMatchIndex,
  collectDependents,
  deriveRounds,
  buildBracketColumns,
  COLUMN_LAYOUT_PRESETS,
  COLUMN_MATCH_OFFSETS,
} from '../utils/bracketUtils';

const STORAGE_KEY = 'copa2026:eliminatoria:v1';

// ─── derive winner from score ─────────────────────────────────────────────────

function resolveWinner(
  match: Match,
  score: MatchScore | undefined,
): BracketTeam | null {
  if (!score || !match.teamA || !match.teamB) return null;
  const a = parseInt(score.goalsA, 10);
  const b = parseInt(score.goalsB, 10);
  if (score.goalsA === '' || score.goalsB === '' || isNaN(a) || isNaN(b)) return null;
  if (a > b) return match.teamA;
  if (b > a) return match.teamB;
  // tie → need penalty winner
  if (score.penaltyWinner === 'A') return match.teamA;
  if (score.penaltyWinner === 'B') return match.teamB;
  return null; // still tied, no penalty winner selected
}

const MATCH_INDEX = buildMatchIndex(ROUNDS);

// ─── localStorage helpers ─────────────────────────────────────────────────────

function loadState(): Record<string, MatchScore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, MatchScore>;
  } catch {
    return {};
  }
}

function saveState(scores: Record<string, MatchScore>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // ignore storage errors
  }
}

// ─── ScoreRoundColumn ─────────────────────────────────────────────────────────

interface ScoreRoundColumnProps {
  round: Round;
  scores: Record<string, MatchScore>;
  winners: Record<string, BracketTeam>;
  onScoreChange: (matchId: string, score: MatchScore) => void;
  topOffsetClassName?: string;
  matchesGapClassName?: string;
  matchOffsetClassNames?: string[];
}

function ScoreRoundColumn({
  round,
  scores,
  winners,
  onScoreChange,
  topOffsetClassName = '',
  matchesGapClassName = 'gap-3',
  matchOffsetClassNames = [],
}: ScoreRoundColumnProps) {
  const isFinalRound = round.id.includes('final') || round.label.toLowerCase() === 'final';
  const columnClassName = isFinalRound
    ? 'flex flex-col gap-2 w-[240px]'
    : 'flex flex-col gap-2 w-[200px]';

  return (
    <div className={columnClassName}>
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center pb-1 border-b border-gray-100 dark:border-gray-700">
        {round.label}
      </h3>
      <div className={`flex flex-col justify-start ${matchesGapClassName} ${topOffsetClassName}`}>
        {round.matches.map((match, index) => (
          <div key={match.id} className={matchOffsetClassNames[index] ?? ''}>
            <ScoreMatchCard
              match={match}
              score={scores[match.id] ?? { goalsA: '', goalsB: '', penaltyWinner: null }}
              winnerTeam={winners[match.id] ?? null}
              onScoreChange={onScoreChange}
              isFinal={isFinalRound}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KnockoutView ───────────────────────────────────────────────────────────

export function KnockoutView() {
  const [scores, setScores] = useState<Record<string, MatchScore>>(loadState);

  // Persist whenever scores change
  useEffect(() => {
    saveState(scores);
  }, [scores]);

  // Derive winners from scores, propagating through rounds
  const derivedWinners = useCallback(
    (currentScores: Record<string, MatchScore>, derivedRoundsData: Round[]): Record<string, BracketTeam> => {
      const winners: Record<string, BracketTeam> = {};
      for (const round of derivedRoundsData) {
        for (const match of round.matches) {
          const winner = resolveWinner(match, currentScores[match.id]);
          if (winner) winners[match.id] = winner;
        }
      }
      return winners;
    },
    [],
  );

  function handleScoreChange(matchId: string, score: MatchScore) {
    setScores((prev) => {
      const next = { ...prev, [matchId]: score };

      // When a score changes, clear all downstream scores (winner may have changed)
      const dependents = collectDependents(matchId, MATCH_INDEX).slice(1); // exclude self
      for (const depId of dependents) {
        delete next[depId];
      }
      return next;
    });
  }

  function handleReset() {
    if (window.confirm('Tem certeza que deseja limpar todos os placares?')) {
      setScores({});
    }
  }

  // We need multiple passes to propagate winners into derived matches
  // Pass 1: base rounds
  const pass1Rounds = deriveRounds(ROUNDS, derivedWinners(scores, ROUNDS));
  // Pass 2: now the QF/SF/Final slots are filled; re-derive
  const pass2Winners = derivedWinners(scores, pass1Rounds);
  const pass2Rounds = deriveRounds(pass1Rounds, pass2Winners);
  const pass3Winners = derivedWinners(scores, pass2Rounds);
  const pass3Rounds = deriveRounds(pass2Rounds, pass3Winners);
  // Merge all winner passes
  const allWinners: Record<string, BracketTeam> = {
    ...derivedWinners(scores, ROUNDS),
    ...pass2Winners,
    ...pass3Winners,
  };

  const displayColumns = buildBracketColumns(pass3Rounds);

  const hasAnyScore = Object.values(scores).some(
    (s) => s.goalsA !== '' || s.goalsB !== '',
  );

  return (
    <section className="px-2 md:px-4 py-4 md:py-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-200 dark:text-blue-200 dark:bg-blue-900/30 dark:border-blue-800 rounded-lg px-3 py-2 flex-1">
          ⚽ Acompanhamento real — insira os placares para registrar os resultados. O vencedor avança automaticamente. Em caso de empate, escolha o vencedor nos pênaltis.
        </p>
        {hasAnyScore && (
          <button
            type="button"
            onClick={handleReset}
            title="Limpar todos os placares"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
          >
            <RotateCcw size={13} />
            Limpar
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 w-max mx-auto">
          {displayColumns.map((round, index) => (
            <ScoreRoundColumn
              key={round.id}
              round={round}
              scores={scores}
              winners={allWinners}
              onScoreChange={handleScoreChange}
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
