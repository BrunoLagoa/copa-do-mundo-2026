import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRankingByPosition } from '../utils/playerRankings';
import { playerAvatarUrl, positionGradient } from '../utils/playerStats';
import type { Player } from '../types';

const POSITIONS: Player['position'][] = ['Atacante', 'Meio-campista', 'Defensor', 'Goleiro'];

const POSITION_EMOJI: Record<Player['position'], string> = {
  'Atacante':      '⚽',
  'Meio-campista': '🎯',
  'Defensor':      '🛡️',
  'Goleiro':       '🧤',
};

export function RankingsView() {
  const [activePosition, setActivePosition] = useState<Player['position']>('Atacante');

  const ranking = useMemo(() => getRankingByPosition(activePosition), [activePosition]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-1">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Destaques</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          Estatísticas ilustrativas — geradas para fins de demonstração
        </p>
      </div>

      {/* Abas de posição */}
      <div className="flex gap-2 mt-4 mb-6 overflow-x-auto pb-1">
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setActivePosition(pos)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 ${
              activePosition === pos
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{POSITION_EMOJI[pos]}</span>
            {pos}
          </button>
        ))}
      </div>

      {/* Lista */}
      <ol className="space-y-2">
        {ranking.map(({ player, teamSlug, teamName, teamFlag, primaryStat }, idx) => {
          const gradient = positionGradient(player.position);
          const pct = Math.round((primaryStat.value / primaryStat.max) * 100);
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;

          return (
            <li key={`${teamSlug}-${player.number}`}>
              <Link
                to={`/player/${teamSlug}/${player.number}`}
                state={{ player, teamSlug, teamFlag }}
                className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:shadow-md hover:border-green-400 dark:hover:border-green-500 transition-all group"
              >
                {/* Posição no rank */}
                <div className="w-7 text-center shrink-0">
                  {medal ? (
                    <span className="text-lg leading-none">{medal}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} overflow-hidden shrink-0 shadow`}>
                  <img
                    src={playerAvatarUrl(player.name)}
                    alt={player.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info + barra */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {player.name}
                    </p>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 tabular-nums shrink-0">
                      {primaryStat.value}{primaryStat.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                      {teamFlag} {teamName}
                    </span>
                  </div>
                  {/* Barra de progresso */}
                  <div className="mt-1.5 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
