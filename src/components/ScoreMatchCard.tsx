import type { BracketTeam, Match } from '../types';

export interface MatchScore {
  goalsA: string;
  goalsB: string;
  penaltyWinner: 'A' | 'B' | null; // only when goals are equal
}

interface ScoreMatchCardProps {
  match: Match;
  score: MatchScore;
  winnerTeam: BracketTeam | null;
  onScoreChange: (matchId: string, score: MatchScore) => void;
  isFinal?: boolean;
}

interface ScoreTeamRowProps {
  team: BracketTeam | null;
  goals: string;
  isWinner: boolean;
  disabled: boolean;
  onGoalsChange: (v: string) => void;
  isFinal?: boolean;
}

function ScoreTeamRow({
  team,
  goals,
  isWinner,
  disabled,
  onGoalsChange,
  isFinal = false,
}: ScoreTeamRowProps) {
  const base = isFinal
    ? 'flex items-center gap-2.5 px-4 py-3 rounded-xl text-base'
    : 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm';

  const winner =
    'bg-green-50 border border-green-300 font-semibold text-green-900 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200';
  const normal =
    'bg-gray-50 border border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200';
  const empty =
    'bg-gray-50 border border-dashed border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500';

  if (!team) {
    return (
      <div className={`${base} ${empty}`}>
        <span className="text-base">—</span>
        <span className="flex-1">A definir</span>
      </div>
    );
  }

  return (
    <div className={`${base} ${isWinner ? winner : normal}`}>
      <span className="text-base leading-none">{team.flag}</span>
      <span className="flex-1 truncate">{team.name}</span>
      {team.seed && (
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mr-1">
          {team.seed}
        </span>
      )}
      <input
        type="number"
        min={0}
        max={99}
        value={goals}
        disabled={disabled}
        onChange={(e) => onGoalsChange(e.target.value)}
        placeholder="–"
        className={[
          'w-10 text-center text-sm font-bold rounded-md border py-0.5 focus:outline-none focus:ring-2 focus:ring-green-500',
          'bg-white dark:bg-gray-900',
          isWinner
            ? 'border-green-400 text-green-800 dark:border-emerald-600 dark:text-emerald-200'
            : 'border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-100',
          disabled ? 'opacity-40 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />
    </div>
  );
}

export function ScoreMatchCard({
  match,
  score,
  winnerTeam,
  onScoreChange,
  isFinal = false,
}: ScoreMatchCardProps) {
  const bothEmpty = match.teamA === null && match.teamB === null;
  const disabled = bothEmpty;

  const goalsANum = parseInt(score.goalsA, 10);
  const goalsBNum = parseInt(score.goalsB, 10);
  const bothFilled =
    score.goalsA !== '' && score.goalsB !== '' && !isNaN(goalsANum) && !isNaN(goalsBNum);
  const isTied = bothFilled && goalsANum === goalsBNum;

  const finalCardWinnerAnimation = isFinal && winnerTeam ? 'final-card-champion-animate' : '';

  const cardClassName = isFinal
    ? `bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/35 dark:to-gray-900 rounded-2xl border border-amber-300 dark:border-amber-700/70 shadow-md p-5 flex flex-col gap-2.5 ${finalCardWinnerAnimation}`
    : 'bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3 flex flex-col gap-1.5';

  const metaClassName = isFinal
    ? 'flex items-center justify-between text-sm text-amber-700 dark:text-amber-300 mb-0.5 font-medium'
    : 'flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-0.5';

  const vsClassName = isFinal
    ? 'text-center text-sm text-amber-500 dark:text-amber-400 font-semibold'
    : 'text-center text-xs text-gray-300 dark:text-gray-600 font-medium';

  function handleGoalsA(v: string) {
    const next: MatchScore = { ...score, goalsA: v, penaltyWinner: null };
    onScoreChange(match.id, next);
  }

  function handleGoalsB(v: string) {
    const next: MatchScore = { ...score, goalsB: v, penaltyWinner: null };
    onScoreChange(match.id, next);
  }

  function handlePenaltyWinner(side: 'A' | 'B') {
    onScoreChange(match.id, {
      ...score,
      penaltyWinner: score.penaltyWinner === side ? null : side,
    });
  }

  const isWinnerA =
    winnerTeam !== null && match.teamA !== null && winnerTeam.name === match.teamA.name;
  const isWinnerB =
    winnerTeam !== null && match.teamB !== null && winnerTeam.name === match.teamB.name;

  return (
    <div className={cardClassName}>
      <div className={metaClassName}>
        <span>{match.date}</span>
        <span>{match.city}</span>
      </div>

      <ScoreTeamRow
        team={match.teamA}
        goals={score.goalsA}
        isWinner={isWinnerA}
        disabled={disabled || match.teamA === null}
        onGoalsChange={handleGoalsA}
        isFinal={isFinal}
      />

      <div className={vsClassName}>vs</div>

      <ScoreTeamRow
        team={match.teamB}
        goals={score.goalsB}
        isWinner={isWinnerB}
        disabled={disabled || match.teamB === null}
        onGoalsChange={handleGoalsB}
        isFinal={isFinal}
      />

      {/* Penalty tiebreaker — only shown when score is tied and both filled */}
      {isTied && match.teamA && match.teamB && (
        <div className="mt-1 rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 text-center">
            Empate — quem venceu nos pênaltis?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePenaltyWinner('A')}
              className={[
                'flex-1 text-xs font-semibold py-1 rounded-md border transition-colors',
                score.penaltyWinner === 'A'
                  ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {match.teamA.flag} {match.teamA.name}
            </button>
            <button
              type="button"
              onClick={() => handlePenaltyWinner('B')}
              className={[
                'flex-1 text-xs font-semibold py-1 rounded-md border transition-colors',
                score.penaltyWinner === 'B'
                  ? 'bg-green-600 border-green-600 text-white dark:bg-green-700 dark:border-green-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700',
              ].join(' ')}
            >
              {match.teamB.flag} {match.teamB.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
