import type { BracketTeam, BracketMatch } from '../types';
import type { KnockoutMatchData } from '../hooks/useKnockoutBracket';

interface ResultMatchCardProps {
  match: BracketMatch;
  result: KnockoutMatchData | undefined;
  winnerTeam: BracketTeam | null;
  isFinal?: boolean;
  /** Disputa do 3º lugar — visual bronze, tamanho intermediário. */
  isThird?: boolean;
}

interface ResultTeamRowProps {
  team: BracketTeam | null;
  score: number | null;
  isWinner: boolean;
  dim: boolean; // perdedor de jogo encerrado → esmaecido
  isFinal?: boolean;
}

function ResultTeamRow({ team, score, isWinner, dim, isFinal = false }: ResultTeamRowProps) {
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
    <div className={`${base} ${isWinner ? winner : normal} ${dim ? 'opacity-55' : ''}`}>
      <span className="text-base leading-none">{team.flag}</span>
      <span className="flex-1 truncate">{team.name}</span>
      {team.seed && (
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0 mr-1">{team.seed}</span>
      )}
      <span
        className={[
          'w-7 text-center text-sm font-bold tabular-nums',
          score == null ? 'text-gray-300 dark:text-gray-600' : '',
          isWinner ? 'text-green-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {score == null ? '–' : score}
      </span>
    </div>
  );
}

export function ResultMatchCard({
  match,
  result,
  winnerTeam,
  isFinal = false,
  isThird = false,
}: ResultMatchCardProps) {
  const state = result?.state ?? 'pre';
  const isLive = result?.isLive ?? false;
  const isFinished = state === 'post';

  const champion = isFinal && isFinished && winnerTeam;
  const finalCardWinnerAnimation = champion ? 'final-card-champion-animate' : '';

  const cardClassName = isFinal
    ? `bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/35 dark:to-gray-900 rounded-2xl border border-amber-300 dark:border-amber-700/70 shadow-md p-5 flex flex-col gap-2.5 ${finalCardWinnerAnimation}`
    : isThird
      ? 'bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-gray-900 rounded-2xl border border-orange-300 dark:border-orange-800/60 w-full shadow-sm p-4 flex flex-col gap-2'
      : 'bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-3 flex flex-col gap-1.5';

  const metaClassName = isFinal
    ? 'flex items-center justify-between text-sm text-amber-700 dark:text-amber-300 mb-0.5 font-medium'
    : isThird
      ? 'flex items-center justify-between text-xs text-orange-700 dark:text-orange-300/90 mb-0.5 font-medium'
      : 'flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-0.5';
  const timeClass =
    isFinal || isThird
      ? 'text-amber-700 dark:text-amber-300 font-bold tabular-nums'
      : 'text-gray-700 dark:text-gray-200 font-bold tabular-nums';

  const vsClassName = isFinal
    ? 'text-center text-sm text-amber-500 dark:text-amber-400 font-semibold'
    : isThird
      ? 'text-center text-xs text-orange-400 dark:text-orange-500/80 font-medium'
      : 'text-center text-xs text-gray-300 dark:text-gray-600 font-medium';

  const isWinnerA =
    winnerTeam !== null && match.teamA !== null && winnerTeam.name === match.teamA.name;
  const isWinnerB =
    winnerTeam !== null && match.teamB !== null && winnerTeam.name === match.teamB.name;

  // Em jogo encerrado, esmaece o perdedor (mantém o foco no classificado).
  const dimA = isFinished && winnerTeam !== null && !isWinnerA;
  const dimB = isFinished && winnerTeam !== null && !isWinnerB;

  return (
    <div className={cardClassName}>
      <div className={metaClassName}>
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
            </span>
            AO VIVO{result?.clock ? ` · ${result.clock}` : ''}
          </span>
        ) : (
          <span>
            {match.time && <span className={timeClass}>{match.time}</span>}
            {match.time && ' · '}
            {match.date}
          </span>
        )}
        <span>{match.city}</span>
      </div>

      <ResultTeamRow
        team={match.teamA}
        score={result?.scoreA ?? null}
        isWinner={isWinnerA}
        dim={dimA}
        isFinal={isFinal}
      />

      <div className={vsClassName}>vs</div>

      <ResultTeamRow
        team={match.teamB}
        score={result?.scoreB ?? null}
        isWinner={isWinnerB}
        dim={dimB}
        isFinal={isFinal}
      />

      {isFinished && (
        <p className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500">
          {result?.isPenalty ? 'Encerrado · pênaltis' : 'Encerrado'}
        </p>
      )}
    </div>
  );
}
