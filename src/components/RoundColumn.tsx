import type { BracketTeam, Round } from '../types';
import { MatchCard } from './MatchCard';

interface RoundColumnProps {
  round: Round;
  winners: Record<string, BracketTeam>;
  onSelectWinner: (matchId: string, team: BracketTeam) => void;
  topOffsetClassName?: string;
  matchesGapClassName?: string;
}

export function RoundColumn({
  round,
  winners,
  onSelectWinner,
  topOffsetClassName = '',
  matchesGapClassName = 'gap-3',
}: RoundColumnProps) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center pb-1 border-b border-gray-100 dark:border-gray-700">
        {round.label}
      </h3>
      <div className={`flex flex-col justify-start ${matchesGapClassName} ${topOffsetClassName}`}>
        {round.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            winnerTeam={winners[match.id] ?? null}
            onSelectWinner={(team) => onSelectWinner(match.id, team)}
          />
        ))}
      </div>
    </div>
  );
}
