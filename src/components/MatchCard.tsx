import type { BracketTeam, Match } from '../types';

interface MatchCardProps {
  match: Match;
  winnerTeam: BracketTeam | null;
  onSelectWinner: (team: BracketTeam) => void;
}

interface TeamButtonProps {
  team: BracketTeam | null;
  isWinner: boolean;
  disabled: boolean;
  onClick: () => void;
}

function TeamButton({ team, isWinner, disabled, onClick }: TeamButtonProps) {
  const base =
    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm';
  const winner = 'bg-green-50 border border-green-300 font-semibold text-green-900 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200';
  const normal = 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700';
  const empty = 'bg-gray-50 border border-dashed border-gray-200 text-gray-400 cursor-default dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500';

  if (!team) {
    return (
      <div className={`${base} ${empty}`}>
        <span className="text-base">—</span>
        <span>A definir</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${isWinner ? winner : normal} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
    >
      <span className="text-base leading-none">{team.flag}</span>
      <span className="flex-1 truncate">{team.name}</span>
      {team.seed && (
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{team.seed}</span>
      )}
    </button>
  );
}

export function MatchCard({ match, winnerTeam, onSelectWinner }: MatchCardProps) {
  const bothEmpty = match.teamA === null && match.teamB === null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-0.5">
        <span>{match.date}</span>
        <span>{match.city}</span>
      </div>

      <TeamButton
        team={match.teamA}
        isWinner={winnerTeam?.name === match.teamA?.name}
        disabled={bothEmpty || match.teamA === null}
        onClick={() => match.teamA && onSelectWinner(match.teamA)}
      />

      <div className="text-center text-xs text-gray-300 dark:text-gray-600 font-medium">vs</div>

      <TeamButton
        team={match.teamB}
        isWinner={winnerTeam?.name === match.teamB?.name}
        disabled={bothEmpty || match.teamB === null}
        onClick={() => match.teamB && onSelectWinner(match.teamB)}
      />
    </div>
  );
}
